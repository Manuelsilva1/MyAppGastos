-- =====================================================================
-- V2: seed de monedas y categorías por defecto
-- Las categorías pertenecen a un usuario (user_id NOT NULL), así que no pueden
-- insertarse globalmente: seed_default_categories(user_id) se invoca al registrar un usuario.
-- =====================================================================

INSERT INTO currencies (code, name, symbol, decimals) VALUES
    ('UYU', 'Peso uruguayo',        '$',   2),
    ('USD', 'Dólar estadounidense', 'US$', 2),
    ('ARS', 'Peso argentino',       '$',   2),
    ('BRL', 'Real brasileño',       'R$',  2),
    ('EUR', 'Euro',                 '€',   2);

CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID) RETURNS void AS $$
BEGIN
    INSERT INTO categories (user_id, parent_id, name, kind, icon, sort_order) VALUES
        (p_user_id, NULL, 'Supermercado',   'EXPENSE', 'shopping-cart',  1),
        (p_user_id, NULL, 'Comida afuera',  'EXPENSE', 'utensils',       2),
        (p_user_id, NULL, 'Transporte',     'EXPENSE', 'bus',            3),
        (p_user_id, NULL, 'Combustible',    'EXPENSE', 'fuel',           4),
        (p_user_id, NULL, 'Vivienda',       'EXPENSE', 'house',          5),
        (p_user_id, NULL, 'Servicios',      'EXPENSE', 'plug',           6),
        (p_user_id, NULL, 'Salud',          'EXPENSE', 'heart-pulse',    7),
        (p_user_id, NULL, 'Educación',      'EXPENSE', 'graduation-cap', 8),
        (p_user_id, NULL, 'Ocio',           'EXPENSE', 'ticket',         9),
        (p_user_id, NULL, 'Ropa',           'EXPENSE', 'shirt',         10),
        (p_user_id, NULL, 'Suscripciones',  'EXPENSE', 'repeat',        11),
        (p_user_id, NULL, 'Otros',          'EXPENSE', 'ellipsis',      12),
        (p_user_id, NULL, 'Sueldo',         'INCOME',  'briefcase',      1),
        (p_user_id, NULL, 'Freelance',      'INCOME',  'laptop',         2),
        (p_user_id, NULL, 'Otros',          'INCOME',  'ellipsis',       3);
END;
$$ LANGUAGE plpgsql;
