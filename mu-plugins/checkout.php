<?php

/*=======================================
 *  Endpoint pour créer les commandes via Stripe
 *  Reçoit les adresses et les détails de paiement
 *  =============================================*/

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/checkout', [
        'methods'             => 'POST',
        'callback'            => 'headless_create_order_from_checkout',
        'permission_callback' => '__return_true',
    ]);

    // Seconde étape d'un paiement qui demande une authentification 3D Secure
    register_rest_route('custom/v1', '/checkout/confirm', [
        'methods'             => 'POST',
        'callback'            => 'headless_confirm_order_payment',
        'permission_callback' => '__return_true',
    ]);
});

// Les e-mails de confirmation et de notification d'une commande du front sont
// envoyés par ce fichier (avec le détail de la livraison) : on coupe les
// courriers WooCommerce équivalents, qui doublonneraient au passage en « En
// cours ». Les autres e-mails (commande terminée, remboursement...) restent
// ceux de WooCommerce.
foreach (['new_order', 'customer_processing_order'] as $headless_email_id) {
    add_filter('woocommerce_email_enabled_' . $headless_email_id, function ($enabled, $order) {
        return ($order instanceof WC_Order && $order->get_meta('_headless_checkout')) ? false : $enabled;
    }, 10, 2);
}

/**
 * Tarifs de livraison Mondial Relay (source de vérité côté serveur).
 * Les ids et les prix doivent correspondre à ceux de CheckoutForm.jsx.
 */
function headless_get_shipping_rates()
{
    return [
        'mr_relay' => [
            'label' => 'Mondial Relay - Point Relais',
            'cost'  => 4.50,
            'type'  => 'relay',
        ],
        'mr_home' => [
            'label' => 'Mondial Relay - Livraison à domicile',
            'cost'  => 7.90,
            'type'  => 'home',
        ],
    ];
}

function headless_create_order_from_checkout($request)
{
    if (!function_exists('wc_create_order')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce est requis.', ['status' => 500]);
    }

    $params = $request->get_json_params();

    $shipping_address = isset($params['shippingAddress']) ? $params['shippingAddress'] : [];
    $billing_address = isset($params['billingAddress']) ? $params['billingAddress'] : [];
    $cart_items = isset($params['cartItems']) ? $params['cartItems'] : [];
    $payment_method_id = isset($params['paymentMethodId']) ? sanitize_text_field($params['paymentMethodId']) : '';

    // Détails de livraison envoyés par le front : { type, method_id, relay_id, relay_name, relay_address }
    $shipping_details = (isset($params['shipping_method_details']) && is_array($params['shipping_method_details']))
        ? $params['shipping_method_details']
        : [];

    if (empty($cart_items)) {
        return new WP_Error('empty_cart', 'Le panier est vide.', ['status' => 400]);
    }

    if (empty($shipping_address['email'])) {
        return new WP_Error('missing_email', 'Email requis.', ['status' => 400]);
    }

    $email = sanitize_email($shipping_address['email']);
    if (!is_email($email)) {
        return new WP_Error('invalid_email', 'Email invalide.', ['status' => 400]);
    }

    if ($payment_method_id === '') {
        return new WP_Error('missing_payment_method', 'Moyen de paiement manquant.', ['status' => 400]);
    }

    if (!class_exists('WC_Stripe_API') || !class_exists('WC_Stripe_Helper')) {
        return new WP_Error('stripe_unavailable', 'Le paiement par carte est indisponible : l\'extension Stripe n\'est pas active.', ['status' => 500]);
    }

    // Mode de livraison : on valide l'id côté serveur, le prix et le type viennent
    // de notre table de tarifs, jamais du front.
    // Transition : tant que le front n'envoie pas encore shipping_method_details,
    // la commande est créée sans ligne de livraison, comme avant. Dès que le
    // front l'envoie, il est entièrement contrôlé ici. Une fois le nouveau front
    // en ligne, rendre ce champ obligatoire.
    $rate = null;
    $shipping_method_id = '';

    if (!empty($shipping_details)) {
        $rates = headless_get_shipping_rates();
        $shipping_method_id = sanitize_text_field($shipping_details['method_id'] ?? '');

        if (!isset($rates[$shipping_method_id])) {
            return new WP_Error('invalid_shipping_method', 'Mode de livraison invalide.', ['status' => 400]);
        }

        $rate = $rates[$shipping_method_id];

        if ($rate['type'] === 'relay' && empty($shipping_details['relay_id'])) {
            return new WP_Error('missing_relay', 'Veuillez sélectionner un point relais.', ['status' => 400]);
        }
    }

    // Seule l'identité authentifiée par le jeton JWT compte. Un identifiant lu
    // dans le corps de la requête laisserait n'importe qui rattacher une
    // commande au compte de son choix, et en remplacer les adresses
    // enregistrées — celles que le formulaire de commande pré-remplit.
    $user_id = get_current_user_id();

    // Entre l'ajout au panier et le paiement, la derniere piece d'une taille a
    // pu partir chez un autre client : on refuse la commande plutot que de
    // vendre un article qui n'existe plus. Pour un produit variable, l'id du
    // panier est celui de la variation, le stock controle est donc celui de
    // la taille choisie.
    foreach ($cart_items as $item) {
        $product_id = isset($item['id']) ? intval($item['id']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;

        if (!$product_id) continue;

        $product = wc_get_product($product_id);
        if (!$product) continue;

        if (!$product->is_in_stock() || !$product->has_enough_stock($quantity)) {
            return new WP_Error(
                'insufficient_stock',
                sprintf('Stock insuffisant pour « %s ». Veuillez modifier votre panier.', $product->get_name()),
                ['status' => 409]
            );
        }
    }

    $order = wc_create_order();

    // Repère les commandes du front (voir le filtre des e-mails WooCommerce en
    // tête de fichier) et garde l'adresse e-mail saisie au paiement.
    $order->update_meta_data('_headless_checkout', '1');
    $order->update_meta_data('_headless_customer_email', $email);

    // Associer la commande au user connecté si disponible
    if ($user_id > 0) {
        $order->set_customer_id($user_id);
    }

    foreach ($cart_items as $item) {
        $product_id = isset($item['id']) ? intval($item['id']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;

        if (!$product_id) continue;

        $product = wc_get_product($product_id);
        if (!$product) continue;

        $order->add_product($product, $quantity);
    }

    if (!empty($shipping_address)) {
        $order->set_address([
            'first_name' => sanitize_text_field($shipping_address['first_name'] ?? ''),
            'last_name'  => sanitize_text_field($shipping_address['last_name'] ?? ''),
            'company'    => sanitize_text_field($shipping_address['company'] ?? ''),
            'address_1'  => sanitize_text_field($shipping_address['address_1'] ?? ''),
            'address_2'  => sanitize_text_field($shipping_address['address_2'] ?? ''),
            'city'       => sanitize_text_field($shipping_address['city'] ?? ''),
            'postcode'   => sanitize_text_field($shipping_address['postcode'] ?? ''),
            'country'    => sanitize_text_field($shipping_address['country'] ?? ''),
            'email'      => $email,
            'phone'      => sanitize_text_field($shipping_address['phone'] ?? ''),
        ], 'shipping');
    }

    if (!empty($billing_address)) {
        $order->set_address([
            'first_name' => sanitize_text_field($billing_address['first_name'] ?? ''),
            'last_name'  => sanitize_text_field($billing_address['last_name'] ?? ''),
            'company'    => sanitize_text_field($billing_address['company'] ?? ''),
            'address_1'  => sanitize_text_field($billing_address['address_1'] ?? ''),
            'address_2'  => sanitize_text_field($billing_address['address_2'] ?? ''),
            'city'       => sanitize_text_field($billing_address['city'] ?? ''),
            'postcode'   => sanitize_text_field($billing_address['postcode'] ?? ''),
            'country'    => sanitize_text_field($billing_address['country'] ?? ''),
            'email'      => $email,
        ], 'billing');
    }

    $order->set_payment_method_title('Stripe');
    $order->set_payment_method('stripe');

    if ($rate) {
        // Ligne de livraison (prix calculé côté serveur)
        $shipping_item = new WC_Order_Item_Shipping();
        $shipping_item->set_method_title($rate['label']);
        $shipping_item->set_method_id($shipping_method_id);
        $shipping_item->set_total($rate['cost']);
        $order->add_item($shipping_item);

        // Métas : type de livraison + point relais choisi (définie dans le mu-plugin Mondial Relay)
        if (function_exists('custom_save_shipping_details')) {
            custom_save_shipping_details($order, [
                'type'          => $rate['type'],
                'method_id'     => $shipping_method_id,
                'relay_id'      => $shipping_details['relay_id'] ?? '',
                'relay_name'    => $shipping_details['relay_name'] ?? '',
                'relay_address' => $shipping_details['relay_address'] ?? '',
            ]);
        }
    }

    $order->calculate_totals();
    $order->save();

    $order_id = $order->get_id();

    // Réduction du stock par WooCommerce lui-même. wc_reduce_stock_levels seul
    // marque chaque ligne (pas de double retrait au passage en Terminée) mais
    // pas la commande : sans ce marquage « stock réduit », WooCommerce ne
    // remet pas le stock quand la commande est annulée. La variante « maybe »
    // fait les deux.
    wc_maybe_reduce_stock_levels($order_id);

    $payment = headless_charge_order($order, $payment_method_id);

    if ($payment['state'] === 'failed') {
        return headless_payment_error($payment);
    }

    // Carte à authentifier (3D Secure) : la commande reste en attente de
    // paiement, le front termine l'authentification puis appelle
    // /checkout/confirm.
    if ($payment['state'] === 'action') {
        return rest_ensure_response([
            'success'           => true,
            'requires_action'   => true,
            'order_id'          => $order_id,
            'order_key'         => $order->get_order_key(),
            'client_secret'     => $payment['client_secret'],
            'payment_intent_id' => $payment['intent_id'],
        ]);
    }

    return rest_ensure_response([
        'success'  => true,
        'order_id' => $order_id,
        'message' => 'Commande créée avec succès',
    ]);
}

/**
 * Débite la carte : crée et confirme un PaymentIntent Stripe avec les clés de
 * l'extension WooCommerce Stripe (mode test ou production selon ses réglages).
 *
 * Retourne l'état du paiement :
 *  - 'paid'   : débité, la commande est passée « En cours » et les e-mails partent
 *  - 'action' : authentification 3D Secure à terminer côté front
 *  - 'failed' : refusé ou erreur, la commande est marquée échouée et son stock restitué
 */
function headless_charge_order($order, $payment_method_id)
{
    // Rien à débiter (ne devrait pas arriver : le prix vient du catalogue).
    if ((float) $order->get_total() <= 0) {
        headless_complete_paid_order($order, '');
        return ['state' => 'paid'];
    }

    $currency = strtolower($order->get_currency());

    try {
        $intent = WC_Stripe_API::request([
            'amount'                    => WC_Stripe_Helper::get_stripe_amount($order->get_total(), $currency),
            'currency'                  => $currency,
            'payment_method'            => $payment_method_id,
            'confirm'                   => 'true',
            'automatic_payment_methods' => ['enabled' => 'true', 'allow_redirects' => 'never'],
            'description'               => sprintf('%s - Commande n°%s', get_bloginfo('name'), $order->get_order_number()),
            'metadata'                  => ['order_id' => (string) $order->get_id(), 'site_url' => home_url()],
        ], 'payment_intents');
    } catch (Exception $e) {
        return headless_payment_failed($order, 'Le service de paiement ne répond pas.', 'unavailable');
    }

    if (!empty($intent->error)) {
        $reason = isset($intent->error->message) ? $intent->error->message : 'Paiement refusé.';
        return headless_payment_failed($order, $reason, headless_stripe_error_slug($intent->error));
    }

    $order->update_meta_data('_stripe_intent_id', $intent->id);
    $order->save();

    if ($intent->status === 'succeeded') {
        headless_complete_paid_order($order, $intent->id);
        return ['state' => 'paid'];
    }

    if ($intent->status === 'requires_action') {
        return [
            'state'         => 'action',
            'client_secret' => $intent->client_secret,
            'intent_id'     => $intent->id,
        ];
    }

    return headless_payment_failed($order, 'Le paiement n\'a pas pu être finalisé.', 'generic');
}

/**
 * Commande payée : « En cours », profil client, e-mails.
 */
function headless_complete_paid_order($order, $transaction_id)
{
    $order->payment_complete($transaction_id);

    $user_id = $order->get_customer_id();
    if ($user_id > 0) {
        // Renseigner les adresses du profil (première commande uniquement)
        headless_save_customer_addresses_from_order($order, $user_id);
    }

    $to = $order->get_meta('_headless_customer_email') ?: $order->get_billing_email();
    headless_send_order_confirmation_email($order, $to);
    headless_send_order_notification_to_admin($order);
}

/**
 * Paiement refusé : la commande passe en « Échouée » et le stock réservé à sa
 * création est restitué. $reason (le texte de Stripe, en anglais) sert à la
 * note de commande destinée au gestionnaire ; $slug, au message du client.
 */
function headless_payment_failed($order, $reason, $slug = 'generic')
{
    $order->update_status('failed', 'Paiement Stripe refusé : ' . $reason);
    wc_maybe_increase_stock_levels($order->get_id());

    return ['state' => 'failed', 'slug' => $slug];
}

/**
 * Code court décrivant un refus de Stripe, sans rien dire de plus que ce qu'un
 * client peut savoir (une carte perdue ou volée est présentée comme refusée).
 * Le front traduit chaque code (errors.payment.* dans les fichiers de langue).
 */
function headless_stripe_error_slug($error)
{
    $code = !empty($error->decline_code) ? $error->decline_code : (isset($error->code) ? $error->code : '');

    $slugs = [
        'insufficient_funds'                    => 'insufficient_funds',
        'expired_card'                          => 'expired_card',
        'incorrect_cvc'                         => 'incorrect_cvc',
        'invalid_cvc'                           => 'incorrect_cvc',
        'incorrect_number'                      => 'incorrect_number',
        'invalid_number'                        => 'incorrect_number',
        'invalid_expiry_month'                  => 'invalid_expiry',
        'invalid_expiry_year'                   => 'invalid_expiry',
        'processing_error'                      => 'processing_error',
        'authentication_required'               => 'authentication_failed',
        'payment_intent_authentication_failure' => 'authentication_failed',
    ];

    return isset($slugs[$code]) ? $slugs[$code] : 'declined';
}

/**
 * Réponse d'erreur 402 d'un paiement refusé : message en français pour les
 * appels directs, et le code ('payment_error') que le front traduit.
 */
function headless_payment_error($payment)
{
    $messages = [
        'declined'              => 'Votre carte a été refusée. Essayez une autre carte ou contactez votre banque.',
        'insufficient_funds'    => 'Fonds insuffisants sur cette carte.',
        'expired_card'          => 'Cette carte est expirée.',
        'incorrect_cvc'         => 'Le code de sécurité (CVC) de la carte est incorrect.',
        'incorrect_number'      => 'Le numéro de carte est invalide.',
        'invalid_expiry'        => 'La date d\'expiration de la carte est invalide.',
        'processing_error'      => 'Une erreur est survenue lors du traitement de la carte. Veuillez réessayer.',
        'authentication_failed' => 'L\'authentification de la carte a échoué.',
        'unavailable'           => 'Le service de paiement est momentanément indisponible. Veuillez réessayer dans quelques instants.',
        'generic'               => 'Le paiement n\'a pas pu être finalisé.',
    ];

    $slug = isset($messages[$payment['slug']]) ? $payment['slug'] : 'generic';

    return new WP_Error('payment_failed', $messages[$slug], ['status' => 402, 'payment_error' => $slug]);
}

/**
 * Fin d'un paiement 3D Secure : on ne croit pas le front, on relit le
 * PaymentIntent chez Stripe. Seul le détenteur de la clé de la commande (reçue
 * à la création) peut la confirmer.
 */
function headless_confirm_order_payment($request)
{
    if (!function_exists('wc_get_order') || !class_exists('WC_Stripe_API')) {
        return new WP_Error('stripe_unavailable', 'Le paiement par carte est indisponible.', ['status' => 500]);
    }

    $params    = $request->get_json_params();
    $order_id  = isset($params['order_id']) ? absint($params['order_id']) : 0;
    $order_key = isset($params['order_key']) ? sanitize_text_field($params['order_key']) : '';
    $intent_id = isset($params['payment_intent_id']) ? sanitize_text_field($params['payment_intent_id']) : '';

    $order = $order_id ? wc_get_order($order_id) : null;

    if (
        !$order
        || !$order->get_meta('_headless_checkout')
        || !hash_equals($order->get_order_key(), $order_key)
        || $intent_id === ''
        || !hash_equals((string) $order->get_meta('_stripe_intent_id'), $intent_id)
    ) {
        return new WP_Error('invalid_order', 'Commande introuvable.', ['status' => 404]);
    }

    // Déjà confirmée (double appel) : on répond comme au premier.
    if ($order->has_status(['processing', 'completed'])) {
        return rest_ensure_response(['success' => true, 'order_id' => $order_id]);
    }

    if (!$order->has_status('pending')) {
        return new WP_Error('order_not_payable', 'Cette commande ne peut plus être payée.', ['status' => 409]);
    }

    try {
        $intent = WC_Stripe_API::retrieve('payment_intents/' . $intent_id);
    } catch (Exception $e) {
        return new WP_Error('payment_unverified', 'Le service de paiement ne répond pas. Veuillez réessayer.', ['status' => 502]);
    }

    if (empty($intent) || !empty($intent->error)) {
        return new WP_Error('payment_unverified', 'Le paiement n\'a pas pu être vérifié.', ['status' => 502]);
    }

    $same_order = isset($intent->metadata->order_id) && (string) $intent->metadata->order_id === (string) $order_id;
    $amount_ok  = (int) $intent->amount === (int) WC_Stripe_Helper::get_stripe_amount($order->get_total(), $order->get_currency());

    if ($intent->status === 'succeeded' && $same_order && $amount_ok) {
        headless_complete_paid_order($order, $intent->id);
        return rest_ensure_response(['success' => true, 'order_id' => $order_id]);
    }

    $reason = !empty($intent->last_payment_error->message)
        ? $intent->last_payment_error->message
        : 'Authentification de la carte non aboutie.';
    $slug = !empty($intent->last_payment_error)
        ? headless_stripe_error_slug($intent->last_payment_error)
        : 'authentication_failed';

    return headless_payment_error(headless_payment_failed($order, $reason, $slug));
}

/**
 * Texte décrivant la livraison (utilisé dans les e-mails). Vide pour une
 * commande passée sans mode de livraison (ancien front).
 */
function headless_shipping_summary_text($order)
{
    $type = $order->get_meta('_shipping_method_type');

    if (!$type) {
        return '';
    }

    $text = "Livraison: ";

    if ($type === 'relay') {
        $text .= "Point Relais Mondial Relay\n";
        $text .= "  " . $order->get_meta('_mondial_relay_name') . "\n";
        $text .= "  " . $order->get_meta('_mondial_relay_address') . "\n";
        $text .= "  (n° relais : " . $order->get_meta('_mondial_relay_id') . ")\n";
    } else {
        $text .= "À domicile (Mondial Relay)\n";
    }

    return $text . "\n";
}

function headless_send_order_confirmation_email($order, $customer_email)
{
    $subject = 'Confirmation de votre commande n°' . $order->get_order_number();

    $body = "Bonjour,\n\n";
    $body .= "Merci pour votre commande !\n\n";
    $body .= "Numéro de commande: #" . $order->get_order_number() . "\n";
    $body .= "Date: " . $order->get_date_created()->date('d/m/Y H:i') . "\n";
    $body .= "Total: " . $order->get_formatted_order_total() . "\n\n";

    $body .= headless_shipping_summary_text($order);

    $body .= "Articles:\n";
    foreach ($order->get_items() as $item) {
        $body .= "- " . $item->get_name() . " x " . $item->get_quantity() . " = " . wc_price($item->get_total()) . "\n";
    }

    $body .= "\nNous vous remerçions de votre confiance.\n";
    $body .= "Cordialement,\nL'équipe";

    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    wp_mail($customer_email, $subject, $body, $headers);
}

function headless_save_customer_addresses_from_order($order, $user_id)
{
    if (!class_exists('WC_Customer')) {
        return;
    }

    $customer = new WC_Customer($user_id);

    // Récupérer les adresses de la commande
    $shipping = $order->get_address('shipping');
    $billing = $order->get_address('billing');

    // Seule la première commande renseigne les adresses du profil : une
    // adresse saisie ponctuellement au checkout ne remplace pas l'adresse par
    // défaut. Le client la modifie lui-même depuis son profil.
    $has_shipping = $customer->get_shipping_address_1() !== '';
    $has_billing = $customer->get_billing_address_1() !== '';

    if ($has_shipping && $has_billing) {
        return;
    }

    // Enregistrer l'adresse de livraison si le profil n'en a pas encore
    if (!$has_shipping && !empty($shipping)) {
        if (isset($shipping['first_name'])) $customer->set_shipping_first_name(sanitize_text_field($shipping['first_name']));
        if (isset($shipping['last_name'])) $customer->set_shipping_last_name(sanitize_text_field($shipping['last_name']));
        if (isset($shipping['company'])) $customer->set_shipping_company(sanitize_text_field($shipping['company']));
        if (isset($shipping['address_1'])) $customer->set_shipping_address_1(sanitize_text_field($shipping['address_1']));
        if (isset($shipping['address_2'])) $customer->set_shipping_address_2(sanitize_text_field($shipping['address_2']));
        if (isset($shipping['city'])) $customer->set_shipping_city(sanitize_text_field($shipping['city']));
        if (isset($shipping['postcode'])) $customer->set_shipping_postcode(sanitize_text_field($shipping['postcode']));
        if (isset($shipping['country'])) $customer->set_shipping_country(sanitize_text_field(strtoupper($shipping['country'])));
        if (isset($shipping['phone'])) $customer->set_shipping_phone(sanitize_text_field($shipping['phone']));
    }

    // Enregistrer l'adresse de facturation si le profil n'en a pas encore
    if (!$has_billing && !empty($billing)) {
        if (isset($billing['first_name'])) $customer->set_billing_first_name(sanitize_text_field($billing['first_name']));
        if (isset($billing['last_name'])) $customer->set_billing_last_name(sanitize_text_field($billing['last_name']));
        if (isset($billing['company'])) $customer->set_billing_company(sanitize_text_field($billing['company']));
        if (isset($billing['address_1'])) $customer->set_billing_address_1(sanitize_text_field($billing['address_1']));
        if (isset($billing['address_2'])) $customer->set_billing_address_2(sanitize_text_field($billing['address_2']));
        if (isset($billing['city'])) $customer->set_billing_city(sanitize_text_field($billing['city']));
        if (isset($billing['postcode'])) $customer->set_billing_postcode(sanitize_text_field($billing['postcode']));
        if (isset($billing['country'])) $customer->set_billing_country(sanitize_text_field(strtoupper($billing['country'])));
        if (isset($billing['phone'])) $customer->set_billing_phone(sanitize_text_field($billing['phone']));
    }

    $customer->save();
}

function headless_send_order_notification_to_admin($order)
{
    $admin_email = get_option('admin_email');
    $subject = 'Nouvelle commande reçue: #' . $order->get_order_number();

    $body = "Une nouvelle commande a été reçue.\n\n";
    $body .= "Numéro de commande: #" . $order->get_order_number() . "\n";
    $body .= "Client: " . $order->get_billing_first_name() . ' ' . $order->get_billing_last_name() . "\n";
    $body .= "Email: " . $order->get_billing_email() . "\n";
    $body .= "Total: " . $order->get_formatted_order_total() . "\n\n";

    $body .= headless_shipping_summary_text($order);

    $body .= "Afficher la commande: " . admin_url('post.php?post=' . $order->get_id() . '&action=edit') . "\n";

    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    wp_mail($admin_email, $subject, $body, $headers);
}
