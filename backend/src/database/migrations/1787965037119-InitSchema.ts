import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1787965037119 implements MigrationInterface {
    name = 'InitSchema1787965037119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('income', 'expense')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "description" character varying NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "category" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "CHK_62aa055cd540df8774499ba22b" CHECK ("amount" > 0), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fe815e76e6d1e733cebfd0f903" ON "transactions" ("user_id", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9acc6efa76de013e8c1553ed2" ON "transactions" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "goals" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "target_amount" numeric(12,2) NOT NULL, "category" character varying, "deadline" date, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "CHK_90d26d4d8033fc0511c438262e" CHECK ("target_amount" > 0), CONSTRAINT "PK_26e17b251afab35580dff769223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88b78010581f2d293699d06444" ON "goals" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "goal_contributions" ("id" SERIAL NOT NULL, "amount" numeric(12,2) NOT NULL, "date" date NOT NULL, "note" character varying, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "goal_id" integer NOT NULL, CONSTRAINT "CHK_7b177bed6eac81f5bac2f06f44" CHECK ("amount" > 0), CONSTRAINT "PK_33413874ace4630a4451a4f4bda" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a3486f892fb14eceb63fd37d49" ON "goal_contributions" ("goal_id") `);
        await queryRunner.query(`CREATE TABLE "error_logs" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "stack" text, "path" character varying NOT NULL, "user_id" integer, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6840885d7eb78406fa7d358be72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goals" ADD CONSTRAINT "FK_88b78010581f2d293699d064441" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "goal_contributions" ADD CONSTRAINT "FK_a3486f892fb14eceb63fd37d492" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "goal_contributions" DROP CONSTRAINT "FK_a3486f892fb14eceb63fd37d492"`);
        await queryRunner.query(`ALTER TABLE "goals" DROP CONSTRAINT "FK_88b78010581f2d293699d064441"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_e9acc6efa76de013e8c1553ed2b"`);
        await queryRunner.query(`DROP TABLE "error_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3486f892fb14eceb63fd37d49"`);
        await queryRunner.query(`DROP TABLE "goal_contributions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88b78010581f2d293699d06444"`);
        await queryRunner.query(`DROP TABLE "goals"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9acc6efa76de013e8c1553ed2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe815e76e6d1e733cebfd0f903"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
