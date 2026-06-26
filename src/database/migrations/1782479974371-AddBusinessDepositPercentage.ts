import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusinessDepositPercentage1782479974371 implements MigrationInterface {
    name = 'AddBusinessDepositPercentage1782479974371'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "deposit_percentage" integer NOT NULL DEFAULT '30'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "deposit_percentage"`);
    }

}
