-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('AVAILABLE', 'ON_FIELD', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('PENDING', 'SURVEYED', 'SALES_VISITED', 'DELIVERED', 'COLLECTED');

-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PROSPECT', 'NEW', 'EXISTING');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('FULL', 'PARTIAL', 'CREDIT');

-- CreateEnum
CREATE TYPE "AnnouncementPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SalesActivityType" AS ENUM ('COLD_CALL', 'COLD_EMAIL', 'QUOTATION_PREP', 'CLIENT_FOLLOWUP', 'REVIVE_DORMANT', 'SOCIAL_PROSPECTING', 'EMAIL_INQUIRY_REPLY', 'CALL_INQUIRY_REPLY', 'WEEKLY_TODO_PREP', 'VEHICLE_RESERVATION', 'SAMPLE_REQUEST', 'MARKETING_MATERIAL_REQUEST', 'DESIGN_REQUEST', 'INTERNAL_PO', 'SALES_MEETING', 'WALKIN_CLIENT', 'CLIENT_ISSUE', 'DELIVERY_FOLLOWUP', 'SAMPLE_FOLLOWUP', 'PRICING_REQUEST', 'STORE_VISIT', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SALES',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar" TEXT,
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agent_status" "AgentStatus",
    "vehicle_id" INTEGER,
    "current_lat" DOUBLE PRECISION,
    "current_lng" DOUBLE PRECISION,
    "last_seen" TIMESTAMP(3),
    "active_tasks_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "model" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "total_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuel_rate" DOUBLE PRECISION NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'PENDING',
    "customer_type" "CustomerType" NOT NULL DEFAULT 'PROSPECT',
    "order_value" DOUBLE PRECISION,
    "collection_amount" DOUBLE PRECISION,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_user_id" INTEGER,
    "current_user_name" TEXT,
    "current_role" "UserRole",
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_logs" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT NOT NULL,
    "location_verified" BOOLEAN NOT NULL DEFAULT false,
    "visit_lat" DOUBLE PRECISION,
    "visit_lng" DOUBLE PRECISION,
    "distance_from_store" DOUBLE PRECISION,
    "photo_url" TEXT,
    "notes" TEXT,
    "check_out_time" TIMESTAMP(3),
    "check_out_photo_url" TEXT,
    "check_out_lat" DOUBLE PRECISION,
    "check_out_lng" DOUBLE PRECISION,
    "check_out_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "work_date" TEXT NOT NULL,
    "clock_in_time" TIMESTAMP(3) NOT NULL,
    "clock_out_time" TIMESTAMP(3),
    "clock_in_lat" DOUBLE PRECISION,
    "clock_in_long" DOUBLE PRECISION,
    "clock_out_lat" DOUBLE PRECISION,
    "clock_out_long" DOUBLE PRECISION,
    "selfie_url" TEXT,
    "duration" TEXT,
    "total_distance" DOUBLE PRECISION,
    "auto_clocked_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "work_date" TEXT NOT NULL,
    "clock_in_time" TIMESTAMP(3) NOT NULL,
    "clock_out_time" TIMESTAMP(3),
    "clock_in_lat" DOUBLE PRECISION,
    "clock_in_long" DOUBLE PRECISION,
    "clock_out_lat" DOUBLE PRECISION,
    "clock_out_long" DOUBLE PRECISION,
    "duration_minutes" INTEGER,
    "total_distance" DOUBLE PRECISION,
    "auto_clocked_out" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_summary" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "work_date" TEXT NOT NULL,
    "total_hours" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "total_distance" DOUBLE PRECISION,
    "total_sessions" INTEGER NOT NULL DEFAULT 0,
    "first_clock_in" TIMESTAMP(3) NOT NULL,
    "last_clock_out" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_tracking_session_points" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "session_id" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_tracking_session_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "target" TEXT NOT NULL DEFAULT 'All',
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'MEDIUM',
    "requires_acknowledgment" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "store_name" TEXT NOT NULL,
    "owner_name" TEXT,
    "contact_number" TEXT NOT NULL,
    "contact_person" TEXT,
    "current_supplier" TEXT,
    "customer_status" TEXT NOT NULL DEFAULT 'PROSPECT',
    "first_purchase_date" TIMESTAMP(3),
    "address" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT NOT NULL,
    "address_line3" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "landmark" TEXT,
    "remarks" TEXT,
    "gps_latitude" DOUBLE PRECISION NOT NULL,
    "gps_longitude" DOUBLE PRECISION NOT NULL,
    "store_photo_url" TEXT,
    "is_platinum_client" BOOLEAN NOT NULL DEFAULT false,
    "surveyor_id" INTEGER NOT NULL,
    "surveyor_name" TEXT NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "assigned_to_id" INTEGER,
    "assigned_to_name" TEXT,
    "assigned_at" TIMESTAMP(3),

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_assignments" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "sales_agent_id" INTEGER NOT NULL,
    "assigned_by" INTEGER,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_tracking_points" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "attendance_id" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_tracking_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "transaction_number" TEXT NOT NULL,
    "survey_id" INTEGER,
    "assignment_id" INTEGER,
    "store_name" TEXT NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "payment_terms" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requires_delivery" BOOLEAN NOT NULL DEFAULT false,
    "delivery_date" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "reviewed_by" INTEGER,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "survey_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "delivery_date" DATE NOT NULL,
    "total_items" INTEGER,
    "items_description" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "delivery_address" TEXT,
    "contact_person" TEXT,
    "contact_number" TEXT,
    "gps_latitude" DECIMAL(10,8),
    "gps_longitude" DECIMAL(11,8),
    "special_instructions" TEXT,
    "assigned_to" INTEGER,
    "assigned_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "delivery_notes" TEXT,
    "failure_reason" TEXT,
    "started_at" TIMESTAMP(3),
    "time_out" TIMESTAMP(3),
    "time_in" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "actual_delivery_date" DATE,
    "actual_delivery_time" TIME,
    "start_latitude" DECIMAL(10,8),
    "start_longitude" DECIMAL(11,8),
    "km_out" DECIMAL(10,2),
    "km_out_photo_url" TEXT,
    "km_in" DECIMAL(10,2),
    "km_in_photo_url" TEXT,
    "delivery_proof_photo_url" TEXT,
    "recipient_name" TEXT,
    "recipient_signature_url" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "delivery_time_slot" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_config" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "minimum_version" TEXT NOT NULL,
    "latest_version" TEXT NOT NULL,
    "force_update" BOOLEAN NOT NULL DEFAULT false,
    "update_message" TEXT,
    "store_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_version_history" (
    "id" UUID NOT NULL,
    "platform" TEXT NOT NULL,
    "version_number" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT NOT NULL,
    "changed_by" TEXT,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_version_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_activities" (
    "id" SERIAL NOT NULL,
    "sales_agent_id" INTEGER NOT NULL,
    "survey_id" INTEGER,
    "activity_type" "SalesActivityType" NOT NULL,
    "activity_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proof_image_url" TEXT NOT NULL,
    "notes" TEXT,
    "gps_latitude" DOUBLE PRECISION,
    "gps_longitude" DOUBLE PRECISION,
    "client_name" TEXT,
    "client_contact" TEXT,
    "outcome" TEXT,
    "follow_up_required" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "order_number" TEXT NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "sales_agent_id" INTEGER NOT NULL,
    "store_name" TEXT NOT NULL,
    "contact_person" TEXT,
    "contact_number" TEXT,
    "delivery_address" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "payment_terms" TEXT NOT NULL,
    "amount_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),
    "admin_notes" TEXT,
    "delivery_assigned_to" INTEGER,
    "delivery_assigned_at" TIMESTAMP(3),
    "delivery_completed_at" TIMESTAMP(3),
    "delivery_proof_url" TEXT,
    "collector_assigned_to" INTEGER,
    "collector_assigned_at" TIMESTAMP(3),
    "collection_completed_at" TIMESTAMP(3),
    "gps_latitude" DOUBLE PRECISION,
    "gps_longitude" DOUBLE PRECISION,
    "proof_image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "collector_id" INTEGER NOT NULL,
    "amount_collected" DECIMAL(12,2) NOT NULL,
    "collection_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL,
    "receipt_image_url" TEXT NOT NULL,
    "gps_latitude" DOUBLE PRECISION,
    "gps_longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_vehicle_id_idx" ON "users"("vehicle_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_plate_idx" ON "vehicles"("plate");

-- CreateIndex
CREATE INDEX "vehicles_assigned_to_idx" ON "vehicles"("assigned_to");

-- CreateIndex
CREATE INDEX "stores_status_idx" ON "stores"("status");

-- CreateIndex
CREATE INDEX "stores_customer_type_idx" ON "stores"("customer_type");

-- CreateIndex
CREATE INDEX "stores_current_user_id_idx" ON "stores"("current_user_id");

-- CreateIndex
CREATE INDEX "visit_logs_store_id_idx" ON "visit_logs"("store_id");

-- CreateIndex
CREATE INDEX "visit_logs_user_id_idx" ON "visit_logs"("user_id");

-- CreateIndex
CREATE INDEX "visit_logs_user_role_idx" ON "visit_logs"("user_role");

-- CreateIndex
CREATE INDEX "visit_logs_timestamp_idx" ON "visit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "attendance_user_id_idx" ON "attendance"("user_id");

-- CreateIndex
CREATE INDEX "attendance_work_date_idx" ON "attendance"("work_date");

-- CreateIndex
CREATE INDEX "attendance_auto_clocked_out_idx" ON "attendance"("auto_clocked_out");

-- CreateIndex
CREATE INDEX "attendance_sessions_user_id_idx" ON "attendance_sessions"("user_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_work_date_idx" ON "attendance_sessions"("work_date");

-- CreateIndex
CREATE INDEX "attendance_sessions_work_date_user_id_idx" ON "attendance_sessions"("work_date", "user_id");

-- CreateIndex
CREATE INDEX "attendance_sessions_clock_out_time_idx" ON "attendance_sessions"("clock_out_time");

-- CreateIndex
CREATE INDEX "attendance_summary_user_id_idx" ON "attendance_summary"("user_id");

-- CreateIndex
CREATE INDEX "attendance_summary_work_date_idx" ON "attendance_summary"("work_date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_summary_user_id_work_date_key" ON "attendance_summary"("user_id", "work_date");

-- CreateIndex
CREATE INDEX "gps_tracking_session_points_user_id_idx" ON "gps_tracking_session_points"("user_id");

-- CreateIndex
CREATE INDEX "gps_tracking_session_points_session_id_idx" ON "gps_tracking_session_points"("session_id");

-- CreateIndex
CREATE INDEX "gps_tracking_session_points_timestamp_idx" ON "gps_tracking_session_points"("timestamp");

-- CreateIndex
CREATE INDEX "announcements_created_by_idx" ON "announcements"("created_by");

-- CreateIndex
CREATE INDEX "announcements_timestamp_idx" ON "announcements"("timestamp");

-- CreateIndex
CREATE INDEX "surveys_surveyor_id_idx" ON "surveys"("surveyor_id");

-- CreateIndex
CREATE INDEX "surveys_assigned_to_id_idx" ON "surveys"("assigned_to_id");

-- CreateIndex
CREATE INDEX "surveys_created_at_idx" ON "surveys"("created_at");

-- CreateIndex
CREATE INDEX "surveys_province_idx" ON "surveys"("province");

-- CreateIndex
CREATE INDEX "surveys_city_idx" ON "surveys"("city");

-- CreateIndex
CREATE INDEX "survey_assignments_survey_id_idx" ON "survey_assignments"("survey_id");

-- CreateIndex
CREATE INDEX "survey_assignments_sales_agent_id_idx" ON "survey_assignments"("sales_agent_id");

-- CreateIndex
CREATE INDEX "survey_assignments_status_idx" ON "survey_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "survey_assignments_survey_id_sales_agent_id_key" ON "survey_assignments"("survey_id", "sales_agent_id");

-- CreateIndex
CREATE INDEX "gps_tracking_points_user_id_idx" ON "gps_tracking_points"("user_id");

-- CreateIndex
CREATE INDEX "gps_tracking_points_attendance_id_idx" ON "gps_tracking_points"("attendance_id");

-- CreateIndex
CREATE INDEX "gps_tracking_points_timestamp_idx" ON "gps_tracking_points"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_number_key" ON "transactions"("transaction_number");

-- CreateIndex
CREATE INDEX "transactions_created_by_idx" ON "transactions"("created_by");

-- CreateIndex
CREATE INDEX "transactions_reviewed_by_idx" ON "transactions"("reviewed_by");

-- CreateIndex
CREATE INDEX "transactions_survey_id_idx" ON "transactions"("survey_id");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "delivery_orders_order_number_key" ON "delivery_orders"("order_number");

-- CreateIndex
CREATE INDEX "delivery_orders_assigned_to_idx" ON "delivery_orders"("assigned_to");

-- CreateIndex
CREATE INDEX "delivery_orders_created_by_idx" ON "delivery_orders"("created_by");

-- CreateIndex
CREATE INDEX "delivery_orders_status_idx" ON "delivery_orders"("status");

-- CreateIndex
CREATE INDEX "delivery_orders_delivery_date_idx" ON "delivery_orders"("delivery_date");

-- CreateIndex
CREATE INDEX "delivery_orders_transaction_id_idx" ON "delivery_orders"("transaction_id");

-- CreateIndex
CREATE INDEX "delivery_orders_survey_id_idx" ON "delivery_orders"("survey_id");

-- CreateIndex
CREATE INDEX "app_config_platform_idx" ON "app_config"("platform");

-- CreateIndex
CREATE INDEX "app_config_is_active_idx" ON "app_config"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "app_config_platform_key" ON "app_config"("platform");

-- CreateIndex
CREATE INDEX "app_version_history_platform_idx" ON "app_version_history"("platform");

-- CreateIndex
CREATE INDEX "app_version_history_created_at_idx" ON "app_version_history"("created_at");

-- CreateIndex
CREATE INDEX "sales_activities_sales_agent_id_idx" ON "sales_activities"("sales_agent_id");

-- CreateIndex
CREATE INDEX "sales_activities_survey_id_idx" ON "sales_activities"("survey_id");

-- CreateIndex
CREATE INDEX "sales_activities_activity_type_idx" ON "sales_activities"("activity_type");

-- CreateIndex
CREATE INDEX "sales_activities_activity_date_idx" ON "sales_activities"("activity_date");

-- CreateIndex
CREATE INDEX "sales_activities_follow_up_date_idx" ON "sales_activities"("follow_up_date");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_survey_id_idx" ON "orders"("survey_id");

-- CreateIndex
CREATE INDEX "orders_sales_agent_id_idx" ON "orders"("sales_agent_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_approved_by_idx" ON "orders"("approved_by");

-- CreateIndex
CREATE INDEX "orders_delivery_assigned_to_idx" ON "orders"("delivery_assigned_to");

-- CreateIndex
CREATE INDEX "orders_collector_assigned_to_idx" ON "orders"("collector_assigned_to");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "collections_order_id_idx" ON "collections"("order_id");

-- CreateIndex
CREATE INDEX "collections_collector_id_idx" ON "collections"("collector_id");

-- CreateIndex
CREATE INDEX "collections_collection_date_idx" ON "collections"("collection_date");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_current_user_id_fkey" FOREIGN KEY ("current_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_logs" ADD CONSTRAINT "visit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summary" ADD CONSTRAINT "attendance_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking_session_points" ADD CONSTRAINT "gps_tracking_session_points_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_surveyor_id_fkey" FOREIGN KEY ("surveyor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_sales_agent_id_fkey" FOREIGN KEY ("sales_agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_assignments" ADD CONSTRAINT "survey_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking_points" ADD CONSTRAINT "gps_tracking_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_tracking_points" ADD CONSTRAINT "gps_tracking_points_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_orders" ADD CONSTRAINT "delivery_orders_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_activities" ADD CONSTRAINT "sales_activities_sales_agent_id_fkey" FOREIGN KEY ("sales_agent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_sales_agent_id_fkey" FOREIGN KEY ("sales_agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_assigned_to_fkey" FOREIGN KEY ("delivery_assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_collector_assigned_to_fkey" FOREIGN KEY ("collector_assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
