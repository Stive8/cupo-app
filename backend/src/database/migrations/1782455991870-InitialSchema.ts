import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782455991870 implements MigrationInterface {
    name = 'InitialSchema1782455991870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('customer', 'business_owner', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "full_name" character varying NOT NULL, "phone" character varying, "role" "public"."users_role_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_vertical_enum" AS ENUM('sports_field', 'barbershop', 'beauty_center', 'professional')`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_status_enum" AS ENUM('pending', 'active', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "businesses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner_id" uuid NOT NULL, "name" character varying NOT NULL, "vertical" "public"."businesses_vertical_enum" NOT NULL, "description" character varying, "address" character varying NOT NULL, "city" character varying NOT NULL, "lat" double precision, "lng" double precision, "metadata" jsonb, "status" "public"."businesses_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "staff_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "business_id" uuid NOT NULL, "name" character varying NOT NULL, "role" character varying, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_cdad75efe024402db5d51140960" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "business_id" uuid NOT NULL, "name" character varying NOT NULL, "duration_minutes" integer NOT NULL, "price_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'COP', "is_active" boolean NOT NULL DEFAULT true, "deleted_at" TIMESTAMP, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."availability_slots_status_enum" AS ENUM('available', 'booked', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "availability_slots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "business_id" uuid NOT NULL, "service_id" uuid NOT NULL, "staff_member_id" uuid, "start_time" TIMESTAMP NOT NULL, "end_time" TIMESTAMP NOT NULL, "status" "public"."availability_slots_status_enum" NOT NULL DEFAULT 'available', "capacity" integer NOT NULL DEFAULT '1', "booked_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_70765e8e17c8f6374060d70589a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "business_id" uuid NOT NULL, "slot_id" uuid NOT NULL, "service_id" uuid NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "total_cents" integer NOT NULL, "deposit_cents" integer NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "cancelled_at" TIMESTAMP, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_channel_enum" AS ENUM('whatsapp', 'email', 'push')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('confirmation', 'reminder_24h', 'reminder_1h', 'cancellation')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "booking_id" uuid NOT NULL, "channel" "public"."notifications_channel_enum" NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "scheduled_at" TIMESTAMP NOT NULL, "sent_at" TIMESTAMP, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'approved', 'rejected', 'refunded')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_id" uuid NOT NULL, "provider" character varying NOT NULL DEFAULT 'wompi', "provider_reference" character varying, "amount_cents" integer NOT NULL, "currency" character varying(3) NOT NULL DEFAULT 'COP', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_8881b96819252080592fe1592ea" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff_members" ADD CONSTRAINT "FK_c8bb2c34e4686298520b9e90fd5" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_c591d6bbbe01010d8705127ba33" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "availability_slots" ADD CONSTRAINT "FK_6d943ec21f19c316ee80b78fc78" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "availability_slots" ADD CONSTRAINT "FK_2a7b3ff0bd663b633420630cd4e" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "availability_slots" ADD CONSTRAINT "FK_74b3663d9a63e479ce684a7e3f6" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_272c637acac69fc055b6cc5d746" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_409d5b76fb2b0501a8c72dd4eeb" FOREIGN KEY ("slot_id") REFERENCES "availability_slots"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_3f5c2196c2b2af99a4697e51741" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_e86edf76dc2424f123b9023a2b2"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_3f5c2196c2b2af99a4697e51741"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_409d5b76fb2b0501a8c72dd4eeb"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_272c637acac69fc055b6cc5d746"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`);
        await queryRunner.query(`ALTER TABLE "availability_slots" DROP CONSTRAINT "FK_74b3663d9a63e479ce684a7e3f6"`);
        await queryRunner.query(`ALTER TABLE "availability_slots" DROP CONSTRAINT "FK_2a7b3ff0bd663b633420630cd4e"`);
        await queryRunner.query(`ALTER TABLE "availability_slots" DROP CONSTRAINT "FK_6d943ec21f19c316ee80b78fc78"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_c591d6bbbe01010d8705127ba33"`);
        await queryRunner.query(`ALTER TABLE "staff_members" DROP CONSTRAINT "FK_c8bb2c34e4686298520b9e90fd5"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_8881b96819252080592fe1592ea"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
        await queryRunner.query(`DROP TABLE "availability_slots"`);
        await queryRunner.query(`DROP TYPE "public"."availability_slots_status_enum"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "staff_members"`);
        await queryRunner.query(`DROP TABLE "businesses"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_vertical_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
