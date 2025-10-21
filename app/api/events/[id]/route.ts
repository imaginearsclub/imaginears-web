import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
export const runtime = "nodejs";
const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        const updated = await prisma.event.update({
            where: { id: params.id },
            data: {
                ...(body.title !== undefined ? { title: body.title } : {}),
                ...(body.world !== undefined ? { world: body.world } : {}),
                ...(body.category !== undefined ? { category: body.category } : {}),
                ...(body.details !== undefined ? { details: body.details ?? null } : {}),
                ...(body.shortDescription !== undefined ? { shortDescription: body.shortDescription ?? null } : {}),
                ...(body.startAt ? { startAt: new Date(body.startAt) } : {}),
                ...(body.endAt ? { endAt: new Date(body.endAt) } : {}),
                ...(body.status ? { status: body.status } : {}),

                ...(body.timezone ? { timezone: body.timezone } : {}),
                ...(body.recurrenceFreq ? { recurrenceFreq: body.recurrenceFreq } : {}),
                ...(body.byWeekday !== undefined ? { byWeekdayJson: Array.isArray(body.byWeekday) ? body.byWeekday : null } : {}),
                ...(body.times !== undefined ? { timesJson: Array.isArray(body.times) ? body.times : null } : {}),
                ...(body.recurrenceUntil !== undefined
                    ? { recurrenceUntil: body.recurrenceUntil ? new Date(body.recurrenceUntil) : null }
                    : {}),
            },
            select: { id: true },
        });

        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
