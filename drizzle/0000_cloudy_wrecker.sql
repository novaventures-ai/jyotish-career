CREATE TABLE "birthProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"profileName" text NOT NULL,
	"birthDate" text NOT NULL,
	"birthTime" text NOT NULL,
	"birthPlace" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"timezone" text NOT NULL,
	"timezoneOffset" text NOT NULL,
	"ayanamsa" varchar(50) DEFAULT 'lahiri',
	"chartData" jsonb,
	"dashaData" jsonb,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "careerCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "incomeStreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "occupations" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoryId" integer,
	"title" text NOT NULL,
	"description" text,
	"skills" jsonb,
	"interests" jsonb,
	"primaryPlanets" jsonb
);
--> statement-breakpoint
CREATE TABLE "remedies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"targetType" varchar(50),
	"targetValue" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "userCareerRecommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"profileId" integer NOT NULL,
	"occupationId" integer NOT NULL,
	"score" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(255) NOT NULL,
	"name" text,
	"email" varchar(255),
	"loginMethod" varchar(50),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"lastSignedIn" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "yogas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "birthProfiles" ADD CONSTRAINT "birthProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_categoryId_careerCategories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."careerCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCareerRecommendations" ADD CONSTRAINT "userCareerRecommendations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCareerRecommendations" ADD CONSTRAINT "userCareerRecommendations_profileId_birthProfiles_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."birthProfiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCareerRecommendations" ADD CONSTRAINT "userCareerRecommendations_occupationId_occupations_id_fk" FOREIGN KEY ("occupationId") REFERENCES "public"."occupations"("id") ON DELETE no action ON UPDATE no action;