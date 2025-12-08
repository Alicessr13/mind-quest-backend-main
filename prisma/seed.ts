import { prisma } from "@/lib/prisma";
import { Slot } from "@prisma/client";

async function main() {
    await prisma.item.createMany({
        data: [
            {
                name: 'Corpo 1',
                description: '',
                image_url: '/images/items/corpoBase1.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Corpo 2',
                description: '',
                image_url: '/images/items/corpoBase2.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Corpo 3',
                description: '',
                image_url: '/images/items/corpoBase3.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Corpo M 1',
                description: '',
                image_url: '/images/items/corpoBaseM1.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Corpo M 2',
                description: '',
                image_url: '/images/items/corpoBaseM2.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Corpo M 3',
                description: '',
                image_url: '/images/items/corpoBaseM3.png',
                price: 0,
                slot: Slot.Body,
            },
            {
                name: 'Cabelo 1',
                description: '',
                image_url: '/images/items/cabelo1.png',
                price: 50,
                slot: Slot.Hair,
            },
            {
                name: 'Blusa 1',
                description: '',
                image_url: '/images/items/blusa1.png',
                price: 50,
                slot: Slot.SkinTop,
            },
            {
                name: 'Saia 1',
                description: '',
                image_url: '/images/items/saia1.png',
                price: 70,
                slot: Slot.SkinBottom,
            },
            {
                name: 'Sapato 1',
                description: '',
                image_url: '/images/items/sapato1.png',
                price: 50,
                slot: Slot.Shoes,
            },
        ]
    });
}

main().then(async () => {
    await prisma.$disconnect()
}).catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
});
