import { User } from "../models";


function create(user: typeof User){

}

function findAll(user: typeof User) {
  
}

function findByDiscordId(user: typeof User){

}

function update(user: typeof User) {
  
}

// Hmmm.... fuck. Time to find a dependency injection library for nodejs...

export default (user: typeof User) => ({
  create: () => create(user),
  findAll: () => findAll(user),
  findByDiscordId: () => findByDiscordId(user),
  update: () => update(user),
})