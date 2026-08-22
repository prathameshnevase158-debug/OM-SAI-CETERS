--
-- PostgreSQL database dump
--

\restrict c5ZKtNv7iBiYZfI0ixRe4l6TC7DaqqkTyLWQyehBZfnwWZLVLWbqP9GDmTWg5Am

-- Dumped from database version 17.10
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Admin" VALUES (1, 'DADA', 'ADMIN_1', NULL, NULL, true, '2026-08-20 09:08:28.199', '2026-08-20 09:33:51.379');
INSERT INTO public."Admin" VALUES (2, 'NAYANA', 'ADMIN_2', NULL, NULL, true, '2026-08-20 09:08:28.28', '2026-08-20 09:33:51.535');
INSERT INTO public."Admin" VALUES (3, 'OM', 'ADMIN_3', NULL, NULL, true, '2026-08-20 09:08:28.283', '2026-08-20 09:33:51.541');
INSERT INTO public."Admin" VALUES (4, 'SUNNY', 'ADMIN_4', NULL, NULL, true, '2026-08-20 09:08:28.285', '2026-08-20 09:33:51.545');


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Customer" VALUES (1, 'राहुल पाटील', '9876543210', 'बारामत', '2026-08-18 11:03:34.152', '2026-08-18 11:08:42.125');
INSERT INTO public."Customer" VALUES (2, 'OM', '5678678779', 'MOR', '2026-08-18 11:21:16.714', '2026-08-18 11:21:16.714');
INSERT INTO public."Customer" VALUES (4, 'jay', '7848994333', 'pune', '2026-08-18 19:05:32.913', '2026-08-18 19:06:08.74');
INSERT INTO public."Customer" VALUES (6, 'jay', '3243553535', 'pune', '2026-08-18 20:12:56.995', '2026-08-18 20:12:56.995');
INSERT INTO public."Customer" VALUES (5, 'om', '7686788686', 'morgaon', '2026-08-18 19:25:28.956', '2026-08-18 20:13:42.815');
INSERT INTO public."Customer" VALUES (7, 'jay', '9826498246', 'pune', '2026-08-18 20:15:09.141', '2026-08-19 07:11:45.368');
INSERT INTO public."Customer" VALUES (8, 'om', '7685677565', 'supe', '2026-08-18 20:21:06.635', '2026-08-19 13:07:59.998');
INSERT INTO public."Customer" VALUES (9, 'sunny', '9005509650', 'supa', '2026-08-19 13:06:57.859', '2026-08-19 13:15:10.449');
INSERT INTO public."Customer" VALUES (10, 'dadu', '4565465475', 'h', '2026-08-20 09:14:24.512', '2026-08-20 09:19:32.267');
INSERT INTO public."Customer" VALUES (11, 'jay', '0470973090', 'supe', '2026-08-20 09:21:05.483', '2026-08-20 09:21:05.483');
INSERT INTO public."Customer" VALUES (12, 'OM', '9857654096', 'U', '2026-08-20 09:25:20.957', '2026-08-20 09:25:20.957');
INSERT INTO public."Customer" VALUES (13, 'OM', '4664564664', 'SUPE', '2026-08-20 09:39:59.826', '2026-08-20 09:39:59.826');
INSERT INTO public."Customer" VALUES (14, 'OM', '7058523409', 'PUNE', '2026-08-20 12:29:41.931', '2026-08-20 12:29:41.931');
INSERT INTO public."Customer" VALUES (15, 'om', '1432332535', 'pune', '2026-08-20 13:56:11.09', '2026-08-20 13:56:11.09');
INSERT INTO public."Customer" VALUES (16, 'om', '5675676576', 'supe', '2026-08-20 14:00:42.058', '2026-08-20 14:00:42.058');
INSERT INTO public."Customer" VALUES (17, 'jay', '5657657657', 'pune', '2026-08-20 14:02:58.505', '2026-08-20 14:02:58.505');
INSERT INTO public."Customer" VALUES (18, 'king', '9769843894', 'po', '2026-08-20 15:44:14.623', '2026-08-20 15:44:14.623');
INSERT INTO public."Customer" VALUES (3, 'kd', '7058523155', 'j', '2026-08-18 17:06:30.707', '2026-08-20 16:05:49.917');


--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Booking" VALUES (23, 'BK-01', '2026-08-19 18:30:00', 10, 400, 400, 0, 'PAID', 'COMPLETED', 'COMPLETE', 16, '2026-08-20 14:00:42.063', '2026-08-20 14:01:55.552', '2026-08-21 18:30:00', 1, 'RETURNED', '2026-08-20 14:01:27.245', 2, 3, '2026-08-20 14:01:55.551');
INSERT INTO public."Booking" VALUES (24, 'BK-02', '2026-08-19 18:30:00', 3, 120, 0, 120, 'PENDING', 'ACTIVE', 'PENDING', 17, '2026-08-20 14:02:58.512', '2026-08-20 14:02:58.512', '2026-08-23 18:30:00', 3, 'BOOKED', NULL, NULL, NULL, NULL);
INSERT INTO public."Booking" VALUES (25, 'BK-03', '2026-08-19 18:30:00', 17, 680, 500, 180, 'PARTIAL', 'ACTIVE', 'PENDING', 3, '2026-08-20 15:02:57.129', '2026-08-20 15:02:57.129', '2026-08-21 18:30:00', 3, 'BOOKED', NULL, NULL, NULL, NULL);
INSERT INTO public."Booking" VALUES (26, '04', '2026-08-19 18:30:00', 107, 1650, 1000, 650, 'PARTIAL', 'ACTIVE', 'PENDING', 18, '2026-08-20 15:44:14.729', '2026-08-20 15:44:14.729', '2026-08-23 18:30:00', 3, 'BOOKED', NULL, NULL, NULL, NULL);
INSERT INTO public."Booking" VALUES (27, '05', '2026-08-19 18:30:00', 1, 5, 5, 0, 'PAID', 'ACTIVE', 'PENDING', 3, '2026-08-20 16:05:49.962', '2026-08-20 16:05:49.962', '2026-08-22 18:30:00', 3, 'BOOKED', NULL, NULL, NULL, NULL);


--
-- Data for Name: Material; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Material" VALUES (6, 'भातवाडी', 10, 5, '2026-08-18 11:07:36.804', '2026-08-18 11:07:36.804');
INSERT INTO public."Material" VALUES (7, 'बादली', 10, 10, '2026-08-18 11:07:36.806', '2026-08-18 11:07:36.806');
INSERT INTO public."Material" VALUES (10, 'दांडा पातेले', 3, 10, '2026-08-18 11:07:36.814', '2026-08-18 11:07:36.814');
INSERT INTO public."Material" VALUES (12, 'मग', 5, 10, '2026-08-18 11:07:36.818', '2026-08-18 11:07:36.818');
INSERT INTO public."Material" VALUES (13, 'कडई', 1, 50, '2026-08-18 11:07:36.82', '2026-08-18 11:07:36.82');
INSERT INTO public."Material" VALUES (11, 'पंचपाळे', 3, 20, '2026-08-18 11:07:36.816', '2026-08-18 13:00:02.944');
INSERT INTO public."Material" VALUES (9, 'पळी', 6, 5, '2026-08-18 11:07:36.811', '2026-08-18 13:00:02.949');
INSERT INTO public."Material" VALUES (14, 'परात', 2, 30, '2026-08-18 11:07:36.821', '2026-08-18 13:00:02.946');
INSERT INTO public."Material" VALUES (1, 'टेबल', 0, 40, '2026-08-18 11:07:36.566', '2026-08-20 15:02:57.161');
INSERT INTO public."Material" VALUES (2, 'खुर्ची', 0, 10, '2026-08-18 11:07:36.791', '2026-08-20 15:44:14.758');
INSERT INTO public."Material" VALUES (3, 'डबल शेगडी', 1, 400, '2026-08-18 11:07:36.795', '2026-08-20 15:44:14.764');
INSERT INTO public."Material" VALUES (4, 'सिंगल शेगडी', 0, 200, '2026-08-18 11:07:36.798', '2026-08-20 15:44:14.766');
INSERT INTO public."Material" VALUES (5, 'घमेली', 5, 10, '2026-08-18 11:07:36.801', '2026-08-20 15:44:14.769');
INSERT INTO public."Material" VALUES (8, 'वरंगाळी', 9, 5, '2026-08-18 11:07:36.809', '2026-08-20 16:05:49.979');


--
-- Data for Name: BookingItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."BookingItem" VALUES (62, 10, 40, 400, 23, 1, 10, 0);
INSERT INTO public."BookingItem" VALUES (63, 3, 40, 120, 24, 1, 0, 0);
INSERT INTO public."BookingItem" VALUES (64, 17, 40, 680, 25, 1, 0, 0);
INSERT INTO public."BookingItem" VALUES (65, 100, 10, 1000, 26, 2, 0, 0);
INSERT INTO public."BookingItem" VALUES (66, 1, 400, 400, 26, 3, 0, 0);
INSERT INTO public."BookingItem" VALUES (67, 1, 200, 200, 26, 4, 0, 0);
INSERT INTO public."BookingItem" VALUES (68, 5, 10, 50, 26, 5, 0, 0);
INSERT INTO public."BookingItem" VALUES (69, 1, 5, 5, 27, 8, 0, 0);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public._prisma_migrations VALUES ('42d76157-8259-4ca3-92c4-f0520cba047b', '4e227c368bed832c284c4bef864a84f428d98ad14106929da6e1b7ce63caffd0', '2026-08-18 16:09:23.108568+05:30', '20260818103923_initial_setup', NULL, NULL, '2026-08-18 16:09:23.050117+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('1bb3f9c5-151c-439f-8194-e32d60afb426', '662d513b5111f09040ab7031b330c1aa5f5c28eec666fba5b251c294b63bc754', '2026-08-19 00:47:48.292243+05:30', '20260818191748_add_event_date_to_booking', NULL, NULL, '2026-08-19 00:47:48.285809+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('5bff5294-e563-41af-ada2-f4dea644ef42', '430fba3392795066547738aa72243925c29f2b9e68605a3f614b408ea488002d', '2026-08-20 06:32:10.378289+05:30', '20260820010210_make_event_date_required', NULL, NULL, '2026-08-20 06:32:10.372522+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('39b59e35-06ea-457b-9c8e-31bcf959c5a4', '821b0101a27f3e65f36d17963b302279d3d2cd1c67d36ff536ccbdbde3d85d48', '2026-08-20 14:38:07.138168+05:30', '20260820090807_add_admin_system', NULL, NULL, '2026-08-20 14:38:07.043583+05:30', 1);
INSERT INTO public._prisma_migrations VALUES ('df26f76a-341d-4736-8ad8-dd27bd50f832', '95d4ab451f535d1bbbb77d86369cd4edb0d47c90a4234b43591fb7ec955b7d3b', '2026-08-20 15:48:28.242802+05:30', '20260820101828_add_order_tracking', NULL, NULL, '2026-08-20 15:48:28.233041+05:30', 1);


--
-- Name: Admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Admin_id_seq"', 4, true);


--
-- Name: BookingItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BookingItem_id_seq"', 69, true);


--
-- Name: Booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Booking_id_seq"', 27, true);


--
-- Name: Customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Customer_id_seq"', 18, true);


--
-- Name: Material_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Material_id_seq"', 14, true);


--
-- PostgreSQL database dump complete
--

\unrestrict c5ZKtNv7iBiYZfI0ixRe4l6TC7DaqqkTyLWQyehBZfnwWZLVLWbqP9GDmTWg5Am

