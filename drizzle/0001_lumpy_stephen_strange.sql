CREATE TABLE `astro_career_mappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`indicatorType` enum('planet_in_house','planet_in_sign','house_lord','yoga','dasha_lord','nakshatra') NOT NULL,
	`indicatorValue` varchar(100) NOT NULL,
	`attributeType` enum('holland_code','skill','work_value','industry','work_style') NOT NULL,
	`attributeValue` varchar(100) NOT NULL,
	`weight` decimal(3,2) DEFAULT '1.00',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `astro_career_mappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `birth_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileName` varchar(100) DEFAULT 'My Profile',
	`birthDate` varchar(10) NOT NULL,
	`birthTime` varchar(8) NOT NULL,
	`birthPlace` varchar(255) NOT NULL,
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`timezone` varchar(50) NOT NULL,
	`timezoneOffset` decimal(4,2) NOT NULL,
	`ayanamsa` enum('lahiri','raman','krishnamurti') DEFAULT 'lahiri',
	`chartData` json,
	`dashaData` json,
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `birth_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `career_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`iconName` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `career_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `income_streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` enum('active','passive','hybrid') NOT NULL,
	`subcategory` varchar(100),
	`description` text,
	`incomePotential` varchar(100),
	`timeInvestment` varchar(100),
	`upfrontInvestment` enum('none','low','medium','high'),
	`riskLevel` enum('low','medium','high'),
	`skillRequirements` json,
	`platforms` json,
	`favorablePlanets` json,
	`favorableHouses` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `income_streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `occupations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`skills` json,
	`interests` json,
	`workValues` json,
	`salaryRange` varchar(100),
	`jobOutlook` varchar(100),
	`educationLevel` varchar(100),
	`primaryPlanets` json,
	`primaryHouses` json,
	`favorableYogas` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `occupations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `remedies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` enum('planet','house','yoga') NOT NULL,
	`targetValue` varchar(50) NOT NULL,
	`remedyType` enum('mantra','gemstone','charity','fasting','deity_worship','lifestyle') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`instructions` text,
	`difficulty` enum('easy','moderate','advanced'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `remedies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_career_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileId` int NOT NULL,
	`occupationId` int,
	`incomeStreamId` int,
	`matchScore` decimal(5,2),
	`matchReasons` json,
	`isSaved` boolean DEFAULT false,
	`isHidden` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_career_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `yogas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('wealth','career','raja','spiritual','other') NOT NULL,
	`description` text,
	`detectionRules` json,
	`positiveEffects` text,
	`negativeEffects` text,
	`careerImplications` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `yogas_id` PRIMARY KEY(`id`)
);
