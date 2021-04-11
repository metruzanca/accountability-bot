import {
  Client,
  Collection,
  GuildMember,
  Message,
  TextChannel,
} from "discord.js";
import {readdir} from "fs";

import dotenv from "dotenv";
dotenv.config();

const {PREFIX = "|"} = process.env
const isDevelopment = process.env.NODE_ENV === "development"

export interface runEvent {
  message: Message
  author: GuildMember
  client: Client
  args: string[]
  isDevelopment: boolean
}

interface Command {
  names: string[]
  run: (event: runEvent) => any // TODO is any necessary??
}

const client = new Client()
const commands: Collection<string[], (event: runEvent) => any> = new Collection()

readdir('./src/commands/', (err, allFiles) => {
  if (err) console.log(err)
  
  let files = allFiles.filter(f => f.endsWith(".ts"))
  if (files.length <= 0) {
    console.log('No commands found!')
  } else {
    for(let file of files) {
      const {names, run} = require(`./commands/${file}`) as Command
      commands.set(names, run);
    }
  }
});

client.on("message", async message => {
  const validMessage = message.channel.type === "dm" || message.author.bot || !message.content.startsWith(PREFIX)
  if(validMessage) return
  
  const author = await message.guild?.members?.fetch(message.author.id)
  if(!author) return

  const args = message.content.split(/ +/)
  if(args.length < 1) return
  
    const command = args.shift()!.toLowerCase().slice(PREFIX.length)
  // I think this find is wrong.
  // TODO rename r and n to be sensible var names
  const commandFile = commands.find((r, n) => n.includes(command))
  if(!commandFile) {
    return
  } else {
    commandFile({
      message,
      author,
      args,
      client,
      isDevelopment,
    })
  }
})

if(isDevelopment) {
  client.on('debug', (e) => {
    console.log(e)
  })
}

client.on('raw', (packet: { t: string; d: { channel_id: string; message_id: string; emoji: { id: string; name: string; }; user_id: string; }; }) => {
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return
  const channel = client.channels.cache.get(packet.d.channel_id) as TextChannel
  if (channel.messages.cache.has(packet.d.message_id)) return
  channel.messages.fetch(packet.d.message_id).then(message => {
    const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name
    const reaction = message.reactions.cache.get(emoji)
    if (reaction) {
      reaction.users.cache.set(packet.d.user_id, client.users.cache.get(packet.d.user_id)!)
      if (packet.t === 'MESSAGE_REACTION_ADD') {
        const user = client.users.cache.get(packet.d.user_id)
        user && client.emit('messageReactionAdd', reaction, user)
      }
      if (packet.t === 'MESSAGE_REACTION_REMOVE') {
        const user = client.users.cache.get(packet.d.user_id)
        user && client.emit('messageReactionRemove', reaction, user)
      }
    }
  })
})

client.once("ready", () => {
  console.log(`Logged in as ${client?.user?.tag}`)
  console.log(`Invite me: https://discord.com/oauth2/authorize?client_id=${830547580168568842}&scope=bot&permissions=8`)
})

if(process.env.TOKEN) {

  console.log("\n\n" + process.env.TOKEN + "\n\n");
  

  client.login(process.env.TOKEN)
    .catch(console.error)
} else {
  console.log("Create a file called .env and put your bot's token in there.");
  process.exit(1);
}
