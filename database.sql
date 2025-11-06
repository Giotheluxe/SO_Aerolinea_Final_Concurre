-- database.sql (v6 - con 20 vuelos en total)
DROP DATABASE IF EXISTS aerolinea2_db;
CREATE DATABASE aerolinea2_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aerolinea2_db;

CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_number VARCHAR(20) NOT NULL UNIQUE,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  terminal VARCHAR(50) NOT NULL,
  gate VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE seats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  seat_code VARCHAR(10) NOT NULL,
  class ENUM('first','economy') NOT NULL,
  status ENUM('free','hold','purchased') NOT NULL DEFAULT 'free',
  hold_token VARCHAR(64) NULL,
  hold_expires_at DATETIME NULL,
  UNIQUE KEY uq_flight_seat (flight_id, seat_code),
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE purchases (
  reservation_code VARCHAR(20) NULL,
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  user_id INT NULL,
  token VARCHAR(64) NOT NULL,
  payment_method ENUM('efectivo','tarjeta') NOT NULL,
  total_amount INT NOT NULL,
  extras_amount INT NOT NULL DEFAULT 0,
  created_at_utc DATETIME NOT NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE purchase_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  seat_code VARCHAR(10) NOT NULL,
  category ENUM('adulto','nino','tercera','primera') NOT NULL,
  price INT NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE purchase_extras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_id INT NOT NULL,
  code VARCHAR(32) NOT NULL,
  label VARCHAR(100) NOT NULL,
  qty INT NOT NULL,
  unit_price INT NOT NULL,
  subtotal INT NOT NULL,
  FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO flights (flight_number,origin,destination,date,time,terminal,gate,type) VALUES
('MXQ-0810','Ciudad de México (MEX)','Doha (Qatar)','2025-10-08','20:00','Terminal 2','Puerta 2','Sencillo'),
('MXP-1105','Ciudad de México (MEX)','París (CDG)','2025-11-05','21:30','Terminal 1','Puerta 15','Sencillo'),
('GX-0922','Guadalajara (GDL)','Los Ángeles (LAX)','2025-09-22','13:45','Terminal 1','Puerta 4','Sencillo'),
('QZ-1201','Querétaro (QRO)','Cancún (CUN)','2025-12-01','08:10','Terminal 1','Puerta 7','Sencillo'),
('PM-1002','Puebla (PBC)','Tijuana (TIJ)','2025-10-02','06:50','Terminal 1','Puerta 3','Sencillo'),
-- 15 Vuelos Adicionales
('MTY-1015','Monterrey (MTY)','Cancún (CUN)','2025-10-15','09:00','Terminal C','Puerta 11','Sencillo'),
('MEX-0930','Ciudad de México (MEX)','Guadalajara (GDL)','2025-09-30','18:30','Terminal 2','Puerta 58','Sencillo'),
('TIJ-1111','Tijuana (TIJ)','Monterrey (MTY)','2025-11-11','11:20','Terminal 1','Puerta 8','Sencillo'),
('CUN-1220','Cancún (CUN)','Ciudad de México (MEX)','2025-12-20','15:00','Terminal 4','Puerta B6','Sencillo'),
('MID-0110','Mérida (MID)','Ciudad de México (MEX)','2026-01-10','07:45','Terminal A','Puerta 3','Sencillo'),
('PBC-0205','Puebla (PBC)','Guadalajara (GDL)','2026-02-05','19:00','Terminal 1','Puerta 1','Sencillo'),
('QRO-0318','Querétaro (QRO)','Tijuana (TIJ)','2026-03-18','12:15','Terminal 1','Puerta 5','Sencillo'),
('MEX-1025','Ciudad de México (MEX)','Nueva York (JFK)','2025-10-25','22:00','Terminal 1','Puerta 33','Sencillo'),
('GDL-1128','Guadalajara (GDL)','Madrid (MAD)','2025-11-28','18:45','Terminal 1','Puerta 9','Sencillo'),
('CUN-0115','Cancún (CUN)','Londres (LHR)','2026-01-15','20:30','Terminal 3','Puerta C12','Sencillo'),
('MTY-0220','Monterrey (MTY)','Dubái (DXB)','2026-02-20','23:50','Terminal A','Puerta 18','Sencillo'),
('MEX-0301','Ciudad de México (MEX)','Tokio (NRT)','2026-03-01','01:00','Terminal 1','Puerta 21','Sencillo'),
('LAX-1210','Los Ángeles (LAX)','Ciudad de México (MEX)','2025-12-10','14:00','Terminal B','Puerta 112','Sencillo'),
('CDG-0122','París (CDG)','Cancún (CUN)','2026-01-22','11:30','Terminal 2E','Puerta K36','Sencillo'),
('DOH-0214','Doha (Qatar)','Guadalajara (GDL)','2026-02-14','02:15','Terminal 1','Puerta A5','Sencillo');

DELIMITER //
CREATE PROCEDURE add_seats(fid INT)
BEGIN
  DECLARE i INT;
  SET i=1;
  WHILE i<=10 DO
    INSERT INTO seats(flight_id, seat_code, class) VALUES (fid, CONCAT('F', LPAD(i,2,'0')), 'first');
    SET i=i+1;
  END WHILE;
  SET i=1;
  WHILE i<=20 DO
    INSERT INTO seats(flight_id, seat_code, class) VALUES (fid, CONCAT('E', LPAD(i,2,'0')), 'economy');
    SET i=i+1;
  END WHILE;
END//
DELIMITER ;

-- Asignar asientos a vuelos originales
CALL add_seats((SELECT id FROM flights WHERE flight_number='MXQ-0810'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MXP-1105'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='GX-0922'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='QZ-1201'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='PM-1002'));

-- Asignar asientos a los 15 vuelos adicionales
CALL add_seats((SELECT id FROM flights WHERE flight_number='MTY-1015'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MEX-0930'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='TIJ-1111'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='CUN-1220'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MID-0110'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='PBC-0205'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='QRO-0318'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MEX-1025'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='GDL-1128'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='CUN-0115'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MTY-0220'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='MEX-0301'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='LAX-1210'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='CDG-0122'));
CALL add_seats((SELECT id FROM flights WHERE flight_number='DOH-0214'));


-- Progreso del usuario (autosave)
CREATE TABLE user_progress (
  user_id INT NOT NULL PRIMARY KEY,
  route VARCHAR(50) NOT NULL,
  params_json JSON NOT NULL,
  state_json JSON NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
