const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const cats = [
    { name: "Makan & Minum", color: "#f59e0b", keywords: "makan,minum,resto,warung,kafe,coffee,bakso,soto,nasi" },
    { name: "Transport", color: "#06b6d4", keywords: "grab,gojek,ojek,bensin,spbu,parkir,tol,busway,commuter" },
    { name: "Belanja", color: "#ec4899", keywords: "shopee,tokopedia,lazada,indomaret,alfamart,hypermart,belanja" },
    { name: "Tagihan", color: "#f43f5e", keywords: "listrik,pln,air,pdam,wifi,internet,telkom,indihome,tagihan" },
    { name: "Hiburan", color: "#8b5cf6", keywords: "netflix,spotify,cinema,bioskop,steam,game,hiburan" },
    { name: "Gaji & Pemasukan", color: "#10b981", keywords: "gaji,transfer,salary,payroll" },
  ];

  for (const c of cats) {
    const existing = await prisma.category.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.category.create({ data: c });
    }
  }

  const acc = await prisma.account.findFirst();
  if (!acc) {
    await prisma.account.create({
      data: { name: "Rekening Utama", bank: "BNI", balance: 0, color: "#f97316" },
    });
  }

  console.log("Seeding done!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
