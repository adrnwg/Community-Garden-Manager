CREATE TABLE Crop2 (
CropName VARCHAR(50)  PRIMARY KEY,
CropUsage VARCHAR(100)
);


CREATE TABLE Crop1 (
Species VARCHAR(50) PRIMARY KEY,
CropName VARCHAR(50)  NOT NULL,
GrowingSeason VARCHAR(20) NOT NULL,
FOREIGN KEY (CropName) REFERENCES Crop2(CropName)
);


CREATE TABLE HarvestYields2 (
Weight INT,
Value INT NOT NULL,
Species VARCHAR(50),
PRIMARY KEY (Weight, Species),
FOREIGN KEY (Species) REFERENCES Crop1(Species)
);


CREATE TABLE HarvestYields1 (
HarvestID INT PRIMARY KEY,
HarvestDate DATE NOT NULL,
Weight INT NOT NULL,
Species VARCHAR(50) NOT NULL,
FOREIGN KEY (Species) REFERENCES Crop1(Species),
FOREIGN KEY (Weight, Species) REFERENCES HarvestYields2(Weight, Species)
);


CREATE TABLE Gardener2 (
LastName VARCHAR(30) NOT NULL,
Email VARCHAR(50) PRIMARY KEY
);


CREATE TABLE Gardener3 (
FirstName VARCHAR(30) NOT NULL,
Email VARCHAR(50) PRIMARY KEY,
FOREIGN KEY (Email) REFERENCES Gardener2(Email)
);


CREATE TABLE Gardener4 (
ResidenceUnitNum INT NOT NULL,
GardenerID INT PRIMARY KEY,
Email VARCHAR(50) UNIQUE,
FOREIGN KEY (Email) REFERENCES Gardener2(Email)
);


CREATE TABLE Plot (
PlotSize INT,
IsAvailable NUMBER(1) NOT NULL,
PlotID INT PRIMARY KEY,
IsIndoor NUMBER(1)
);


CREATE TABLE WaterSchedule2 (
Frequency INT,
Amount INT NOT NULL,
StartTime VARCHAR(50),
PRIMARY KEY (StartTime, Frequency)
);


CREATE TABLE WaterSchedule1 (
Frequency INT NOT NULL,
ScheduleID INT PRIMARY KEY,
StartTime VARCHAR(50) NOT NULL,
Temp INT,
FOREIGN KEY (StartTime, Frequency) REFERENCES WaterSchedule2(StartTime, Frequency)
);


CREATE TABLE BedContains (
Length INT NOT NULL,
Width INT NOT NULL,
Height INT NOT NULL,
FertilizerType VARCHAR(30),
BedID INT,
PlotID INT,
PRIMARY KEY (BedID, PlotID),
FOREIGN KEY (PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE PlantingRecordTracks (
PlantingID INT PRIMARY KEY,
PlantingStyle VARCHAR(100),
QuantityPlanted INT,
PlantedDate DATE,
ExpectedHarvestDate DATE,
BedID INT NOT NULL,
PlotID INT NOT NULL,
CONSTRAINT unique_bed UNIQUE (BedID, PlotID),
FOREIGN KEY(BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
);


CREATE TABLE ToolShedLocatedAt1 (
LastCleanDate DATE PRIMARY KEY,
ConditionLevel INT
);

CREATE TABLE ToolShedLocatedAt2 (
ShedID INT PRIMARY KEY,
LastCleanDate DATE,
Capacity INT NOT NULL,
NumTools INT NOT NULL,
PlotID INT NOT NULL UNIQUE,
FOREIGN KEY(PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE,
FOREIGN KEY (LastCleanDate) REFERENCES ToolShedLocatedAt1(LastCleanDate)
);


CREATE TABLE StoresAndCheckedOutEquipment1 (
PurchaseDate DATE PRIMARY KEY,
ConditionLevel INT
);

CREATE TABLE StoresAndCheckedOutEquipment2 (
EquipmentID INT PRIMARY KEY,
PurchaseDate DATE  NOT NULL,
EquipmentType VARCHAR(50)  NOT NULL,
ShedID INT,
GardenerID INT,
FOREIGN KEY (ShedID) REFERENCES ToolShedLocatedAt2(ShedID)
ON DELETE SET NULL,
FOREIGN KEY (GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE SET NULL,
FOREIGN KEY (PurchaseDate) REFERENCES StoresAndCheckedOutEquipment1(PurchaseDate)
);

CREATE TABLE GardenHoe (
EquipmentID INT PRIMARY KEY,
PlotsTilled INT,
ToolSize INT NOT NULL,
DateLastSharpened DATE,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE WateringCan (
EquipmentID INT PRIMARY KEY,
MaxVolume INT NOT NULL,
Spout VARCHAR(30) NOT NULL,
Material VARCHAR(30) NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE Shovel (
EquipmentID INT PRIMARY KEY,
Manufacturer VARCHAR(30) NOT NULL,
Shape VARCHAR(30) NOT NULL,
Length INT NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);


CREATE TABLE Pruner (
EquipmentID INT PRIMARY KEY,
Manufacturer VARCHAR(30) NOT NULL,
ToolSize INT NOT NULL,
Type VARCHAR(30) NOT NULL,
FOREIGN KEY (EquipmentID) REFERENCES StoresAndCheckedOutEquipment2(EquipmentID)
ON DELETE CASCADE
);




CREATE TABLE Logs (
GardenerID INT,
HarvestID INT,
PRIMARY KEY(GardenerID, HarvestID),
FOREIGN KEY (GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE,
FOREIGN KEY (HarvestID) REFERENCES HarvestYields1(HarvestID)
ON DELETE CASCADE
);


CREATE TABLE Taken (
HarvestID INT,
BedID INT,
PlotID INT,
PRIMARY KEY(HarvestID, BedID, PlotID),
FOREIGN KEY (HarvestID) REFERENCES HarvestYields1(HarvestID)
ON DELETE CASCADE,
FOREIGN KEY (BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
ON DELETE CASCADE
);


CREATE TABLE PlantedIn (
BedID INT,
PlotID INT,
Species VARCHAR(50),
PRIMARY KEY(BedID, PlotID, Species),
FOREIGN KEY(BedID, PlotID) REFERENCES BedContains(BedID, PlotID)
ON DELETE CASCADE,
FOREIGN KEY(Species) REFERENCES Crop1(Species)
ON DELETE CASCADE
);


CREATE TABLE Records (
Species VARCHAR(50),
PlantingID INT,
PRIMARY KEY(Species, PlantingID),
FOREIGN KEY(Species) REFERENCES Crop1(Species)
ON DELETE CASCADE,
FOREIGN KEY(PlantingID) REFERENCES PlantingRecordTracks(PlantingID)
ON DELETE CASCADE
);


CREATE TABLE Rents (
GardenerID INT,
PlotID INT,
PRIMARY KEY(GardenerID, PlotID),
FOREIGN KEY(GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE,
FOREIGN KEY(PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE AssignedTo (
PlotID INT,
ScheduleID INT,
PRIMARY KEY (PlotID, ScheduleID),
FOREIGN KEY (ScheduleID) REFERENCES WaterSchedule1(ScheduleID)
ON DELETE CASCADE,
FOREIGN KEY (PlotID) REFERENCES Plot(PlotID)
ON DELETE CASCADE
);


CREATE TABLE Oversees (
ScheduleID INT,
GardenerID INT,
PRIMARY KEY(ScheduleID, GardenerID),
FOREIGN KEY(ScheduleID) REFERENCES WaterSchedule1(ScheduleID)
ON DELETE CASCADE,
FOREIGN KEY(GardenerID) REFERENCES Gardener4(GardenerID)
ON DELETE CASCADE
);

CREATE OR REPLACE VIEW WATERSCHEDULEFULL AS
    SELECT w1.SCHEDULEID, w1.FREQUENCY, w1.STARTTIME, w1.TEMP, w2.AMOUNT
    FROM WATERSCHEDULE1 w1
    JOIN WATERSCHEDULE2 w2 ON w1.STARTTIME = w2.STARTTIME AND w1.FREQUENCY = w2.FREQUENCY;

CREATE OR REPLACE VIEW TOOLSHEDLOCATEDATFULL AS
    SELECT t2.ShedID AS ShedID, t1.LastCleanDate AS LastCleanDate, t2.Capacity AS Capacity, t2.NumTools AS NumTools, t1.ConditionLevel AS ConditionLevel, t2.PlotID AS PlotID
    FROM ToolShedLocatedAt1 t1
    JOIN ToolShedLocatedAt2 t2 ON t1.LastCleanDate = t2.LastCleanDate;

CREATE OR REPLACE VIEW HARVESTYIELDSFULL AS
    SELECT h1.HarvestID AS HarvestID, h1.HarvestDate AS HarvestDate, h2.Weight AS Weight, h2.Value AS Value, h2.Species AS Species
    FROM HarvestYields1 h1
    JOIN HarvestYields2 h2 ON h1.weight = h2.weight AND h1.species = h2.species;

CREATE OR REPLACE VIEW CROPFULL AS
    SELECT c1.Species, c2.CropName, c1.GrowingSeason, c2.CropUsage
    FROM Crop1 c1
    JOIN Crop2 c2 ON c1.CropName = c2.CropName;

CREATE OR REPLACE VIEW GARDENERFULL AS
    SELECT g3.FirstName, g2.LastName, g4.ResidenceUnitNum, g4.GardenerID, g2.Email
    FROM Gardener2 g2
    JOIN Gardener3 g3 ON g3.Email = g2.Email
    JOIN Gardener4 g4 ON g4.Email = g2.Email;

CREATE OR REPLACE VIEW STORESANDCHECKEDOUTEQUIPMENTFULL AS
    SELECT s2.EquipmentID, s1.PurchaseDate, s2.EquipmentType, s1.ConditionLevel, s2.ShedID, s2.GardenerID
    FROM StoresAndCheckedOutEquipment1 s1
    JOIN StoresAndCheckedOutEquipment2 s2 ON s2.PurchaseDate = s1.PurchaseDate;