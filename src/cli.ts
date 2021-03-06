import 'module-alias/register';

import dotenv from 'dotenv';
import Discord from 'discord.js';

import { formatUpcomingEvent } from './event';
import { checkForNewContests, getUpcomingEvents } from './notify';
import {
  subscribeToChannel,
  unsubcribeFromChannel,
  loadSubscribedChannels,
} from './notifications/channels';

import '@/platforms/codeforces';

dotenv.config();
if (!process.env.DISCORD_TOKEN) {
  throw Error('No DIRCORD_TOKEN variable found in .env file');
}

const client = new Discord.Client();

client.once('ready', () => {
  client.user
    .setPresence({
      activity: { name: '!help' },
    })
    .catch(console.error);

  loadSubscribedChannels(client);

  setInterval(checkForNewContests, 60 * 60 * 1000);
  checkForNewContests();
});

client.on('message', async message => {
  if (message.author.bot) return;

  let response: string;
  // eslint-disable-next-line default-case
  switch (message.content) {
    case '!subscribe':
      response = subscribeToChannel(message.channel)
        ? 'Okay, I will notify you about upcoming contests here!'
        : 'You have already subscribed to this channel!';
      message.channel.send(response).catch(console.error);
      break;
    case '!upcoming':
      message.channel
        .send('Okay, let me check for upcoming events...')
        .catch(console.error);
      (await getUpcomingEvents())
        .map(formatUpcomingEvent)
        .forEach(eventMessage =>
          message.channel.send(eventMessage).catch(console.error),
        );
      break;
    case '!unsubscribe':
      response = unsubcribeFromChannel(message.channel)
        ? 'Okay, I will stop sending notifications here.'
        : 'I am not subscribed to this channel!';
      message.channel.send(response).catch(console.error);
      break;
    case '!help':
      message.channel
        .send(
          '!upcoming - Upcoming contests\n' +
            '!subscribe - Notify upcoming events in this channel\n' +
            '!unsubscribe - Stop notify',
        )
        .catch(console.error);
      break;
  }
});

client.login(process.env.DISCORD_TOKEN);
