import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentReference1782480878832 implements MigrationInterface {
    name = 'AddPaymentReference1782480878832'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" ADD "reference" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_866ddee0e17d9385b4e3b86851d" UNIQUE ("reference")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_866ddee0e17d9385b4e3b86851d"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "reference"`);
    }

}
