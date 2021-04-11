import {runEvent} from "../bot";

export function run(e:runEvent) {
    e.message.reply(`Pong! Current ping is ${e.client.user}`);
}

export const names = ["ping"];