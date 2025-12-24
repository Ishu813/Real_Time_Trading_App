-- CreateTable
CREATE TABLE "RealizedPnl" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "pnl" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealizedPnl_pkey" PRIMARY KEY ("id")
);
