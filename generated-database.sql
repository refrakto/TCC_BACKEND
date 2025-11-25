CREATE TYPE "public"."TipoPluviometro" AS ENUM('manual', 'automatico');--> statement-breakpoint
CREATE TYPE "public"."TipoUsuario" AS ENUM('estagiario', 'admin');--> statement-breakpoint
CREATE TABLE "chuva" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" date NOT NULL,
	CONSTRAINT "chuva_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "jwt_blacklist" (
	"jti" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicao" (
	"idPluvi" integer NOT NULL,
	"idChuva" integer NOT NULL,
	"quantidadeMm" numeric(5, 3) NOT NULL,
	"quantidadeLitros" numeric(5, 2) NOT NULL,
	CONSTRAINT "medicao_idPluvi_idChuva_pk" PRIMARY KEY("idPluvi","idChuva")
);
--> statement-breakpoint
CREATE TABLE "pluviometro" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipo" "TipoPluviometro" NOT NULL,
	"capacidadeLitros" numeric(5, 2) NOT NULL,
	"areaCaptacaoM2" numeric(6, 4) NOT NULL,
	"latitude" numeric(8, 6),
	"longitude" numeric(9, 6),
	"altitude" numeric(8, 2),
	"arquivado" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pluviometro_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL,
	"senha" varchar(300) NOT NULL,
	"permissao" "TipoUsuario" NOT NULL,
	"dataInicio" date,
	"dataFim" date,
	CONSTRAINT "usuario_id_unique" UNIQUE("id"),
	CONSTRAINT "usuario_email_unique" UNIQUE("email"),
	CONSTRAINT "check_estagiario_dataInicio_notNull" CHECK (("usuario"."permissao" != 'estagiario') OR ("usuario"."dataInicio" IS NOT NULL)),
	CONSTRAINT "check_admin_datas_null" CHECK (("usuario"."permissao" != 'admin') OR ("usuario"."dataInicio" IS NULL AND "usuario"."dataFim" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_idPluvi_pluviometro_id_fk" FOREIGN KEY ("idPluvi") REFERENCES "public"."pluviometro"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_idChuva_chuva_id_fk" FOREIGN KEY ("idChuva") REFERENCES "public"."chuva"("id") ON DELETE cascade ON UPDATE no action;