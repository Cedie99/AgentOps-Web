-- AgentOps Database Schema
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/wwmufvcqkpuplsrxpxvo/sql/new)

-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER');
CREATE TYPE "MobileRole" AS ENUM ('SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR');
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'SURVEYED', 'SALES_VISITED', 'DELIVERED', 'COLLECTED');
CREATE TYPE "CustomerType" AS ENUM ('PROSPECT', 'NEW', 'EXISTING');
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');
CREATE TYPE "AgentStatus" AS ENUM ('AVAILABLE', 'ON_FIELD', 'OFF_DUTY');
CREATE TYPE "PaymentStatus" AS ENUM ('FULL', 'PARTIAL', 'CREDIT');
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "avatar" TEXT,
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Vehicle table
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "totalKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelRate" DOUBLE PRECISION NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- Agent table
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" "MobileRole" NOT NULL,
    "status" "AgentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "vehicleId" TEXT,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeTasksCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- Store table
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "customerType" "CustomerType" NOT NULL DEFAULT 'PROSPECT',
    "orderValue" DOUBLE PRECISION,
    "collectionAmount" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "currentAgentId" TEXT,
    "currentAgentName" TEXT,
    "currentRole" "MobileRole",
    "assignedAt" TIMESTAMP(3),

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- TimelineEvent table
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "role" "MobileRole" NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "StoreStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "photoUrl" TEXT,
    "paymentStatus" "PaymentStatus",
    "amountCollected" DOUBLE PRECISION,
    "totalOrderAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- VisitLog table
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "locationVerified" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- Attendance table
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "duration" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- FuelEntry table
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loggedBy" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelEntry_pkey" PRIMARY KEY ("id")
);

-- Announcement table
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT 'All',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Create Unique Indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- Create Indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Vehicle_plate_idx" ON "Vehicle"("plate");
CREATE INDEX "Vehicle_assignedTo_idx" ON "Vehicle"("assignedTo");
CREATE INDEX "Agent_email_idx" ON "Agent"("email");
CREATE INDEX "Agent_vehicleId_idx" ON "Agent"("vehicleId");
CREATE INDEX "Store_status_idx" ON "Store"("status");
CREATE INDEX "Store_customerType_idx" ON "Store"("customerType");
CREATE INDEX "Store_currentAgentId_idx" ON "Store"("currentAgentId");
CREATE INDEX "TimelineEvent_storeId_idx" ON "TimelineEvent"("storeId");
CREATE INDEX "TimelineEvent_agentId_idx" ON "TimelineEvent"("agentId");
CREATE INDEX "TimelineEvent_timestamp_idx" ON "TimelineEvent"("timestamp");
CREATE INDEX "VisitLog_storeId_idx" ON "VisitLog"("storeId");
CREATE INDEX "VisitLog_agentId_idx" ON "VisitLog"("agentId");
CREATE INDEX "VisitLog_timestamp_idx" ON "VisitLog"("timestamp");
CREATE INDEX "Attendance_agentId_idx" ON "Attendance"("agentId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "FuelEntry_vehicleId_idx" ON "FuelEntry"("vehicleId");
CREATE INDEX "FuelEntry_userId_idx" ON "FuelEntry"("userId");
CREATE INDEX "FuelEntry_date_idx" ON "FuelEntry"("date");
CREATE INDEX "Announcement_createdBy_idx" ON "Announcement"("createdBy");
CREATE INDEX "Announcement_timestamp_idx" ON "Announcement"("timestamp");

-- Add Foreign Keys
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Store" ADD CONSTRAINT "Store_currentAgentId_fkey" FOREIGN KEY ("currentAgentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FuelEntry" ADD CONSTRAINT "FuelEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
