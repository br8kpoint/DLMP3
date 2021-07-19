/**************************************************************************
 * 
 *  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
 *  (C) Copyright 2020
 *  Programmed by Andrew Lee 
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 ***************************************************************************/
const Discord = require('discord.js');
const fs = require('fs');
const globby = require('globby');
const path = require('path');
const bot = new Discord.Client();
const config = require('./config.json');
let dispatcher;
let audio;
let voiceChannel;
let fileData;
let mode="random";
let audioIndex = 0;
let files = [];
let playlist="";
let playlists = [];

bot.login(config.token);
/**
 * Set the playlist. Can be in response to a the pefix:playlist command, in which case a message reply is sent.
 * @param {string} cmdplaylist the name of the list to play
 * @param {discord msg object} msg the discord message object to reply to if any
 */
async function setPlayList(cmdplaylist, msg=null){
  if(playlists.includes(cmdplaylist) || cmdplaylist.toUpperCase() == 'ALL'){
    let glob;
    if(cmdplaylist.toUpperCase() == 'ALL')
    {
      // if ALL reset to nothing so it will play all files in ./music
      glob = './music/**/*.mp3';

    }   
    else glob = `./music/${cmdplaylist}/**/*.mp3`
    files = await globby(glob);
    audioIndex = 0;
    playlist = cmdplaylist;
    if(msg) msg.reply(`**Current playlist is now ${playlist} with ${files.length} mp3s.**`);
    //playAudio();
  }else{
    if(msg) msg.reply(`Playlist **${cmdplaylist}** not found!\n\nUse ${config.prefix}Lists to show available playlists.`)
  }
}
function playAudio() {
  voiceChannel = bot.channels.cache.get(config.voiceChannel);
  if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
  
  voiceChannel.join().then(connection => {
    if(mode=='random'){
      audioIndex = Math.floor(Math.random() * files.length);
      audio = files[audioIndex];
    }else{
      if(audioIndex > files.length - 1) audioIndex = 0;   //reset index if past end of list
      audio = files[audioIndex++];
    }
    console.log(`Playing file ${audioIndex} of ${files.length}.`)
    dispatcher = connection.play(audio);
    
    dispatcher.on('start', () => {
      console.log('Now playing ' + path.basename(audio));
      fileData = "Now Playing: " + path.basename(audio);
      fs.writeFile("now-playing.txt", fileData, (err) => { 
      if (err) 
      console.log(err); 
      }); 
      const statusEmbed = new Discord.MessageEmbed()
      .addField('Now Playing', `${path.basename(audio)}`)
      .setColor('#0066ff')

      let statusChannel = bot.channels.cache.get(config.statusChannel);
      if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
      statusChannel.send(statusEmbed);
    });
    
    dispatcher.on('error', console.error);

    dispatcher.on('finish', () => {
      console.log('Music has finished playing.');
      playAudio();
    });
    
  }).catch(e => {
    console.error(e);
  });
  
}

bot.on('ready', async () => {
  console.log('Bot is ready!');
  console.log(`Logged in as ${bot.user.tag}!`);
  console.log(`Prefix: ${config.prefix}`);
  console.log(`Owner ID: ${config.botOwner}`);
  console.log(`Voice Channel: ${config.voiceChannel}`);
  console.log(`Status Channel: ${config.statusChannel}\n`);

  console.log("Scanning mp3s...");
  // use glob to scan the whole music directory to find mp3s in all subfolders
  const paths = await globby(['./music/**/**']);
  console.log(`Found ${paths.length} files:`);
  console.log(paths);
  files = paths.filter(f=>{return path.extname(f).toUpperCase() == ".MP3"});
  playlists  = await (await globby("./music/**",{onlyDirectories:true})).map(item=>item.replace('./music/',""))
  console.log(`${playlists.length} playlists found:`);
  console.log(playlists);
  playlist = config.playlist || 'all';
  console.log(`Setting playlist to ${playlist}`);
  setPlayList(playlist);
  mode = config.mode;
  bot.user.setPresence({
    activity: {
      name: `Music | ${config.prefix}help`
    },
    status: 'online',
  }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

  const readyEmbed = new Discord.MessageEmbed()
  .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
  .setDescription(`Starting bot in ${config.mode} mode...`)
  .setColor('#0066ff')

  let statusChannel = bot.channels.cache.get(config.statusChannel);
  if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
  statusChannel.send(readyEmbed);
  console.log('Connected to the voice channel.');
  playAudio();
});

bot.on('message', async msg => {
  if (msg.author.bot) return;
  if (!msg.guild) return;
  if (!msg.content.toUpperCase().startsWith(config.prefix.toUpperCase())) return;
  let command = msg.content.split(' ')[0];
  command = command.slice(config.prefix.length);

  // Public allowed commands

  if (command.toUpperCase() == 'HELP') {
    if (!msg.guild.member(bot.user).hasPermission('EMBED_LINKS')) return msg.reply('**ERROR: This bot doesn\'t have the permission to send embed links please enable them to use the full help.**');
    const helpEmbed = new Discord.MessageEmbed()
    .setAuthor(`${bot.user.username} Help`, bot.user.avatarURL())
    .setDescription(`Currently playing \`${audio}\`.`)
    .addField('Public Commands', `${config.prefix}help\n${config.prefix}ping\n${config.prefix}git\n${config.prefix}playing\n${config.prefix}singalong\n${config.prefix}about\n`, true)
    .addField('Bot Owner Only', `${config.prefix}join\n${config.prefix}resume\n${config.prefix}pause\n${config.prefix}skip\n${config.prefix}leave\n${config.prefix}stop\n${config.prefix}random\n${config.prefix}sequential\n${config.prefix}lists\n${config.prefix}playlist <List>\n`, true)
    .setFooter('© Copyright 2020 Andrew Lee. Licensed with GPL-3.0.')
    .setColor('#0066ff')

    msg.channel.send(helpEmbed);
  }

  if (command.toUpperCase() == 'PING') {
    msg.reply('Pong!');
  }

  if (command.toUpperCase() == 'GIT') {
    msg.reply('This is the source code of this project.\nhttps://github.com/Alee14/DLMP3');
  }

  if (command.toUpperCase() == 'PLAYING') {
    msg.channel.send('Currently playing `' + path.basename(audio) + '`.');
  }
  if(command.toUpperCase()=='SINGALONG'){
    //find corresponding text file and reply to message.
    let lyricfile = path.join(path.dirname(audio), path.basename(audio,'.mp3')+".txt");
    console.log("Checking for "+ lyricfile);
    if(fs.existsSync(lyricfile)){
      let lyrics = fs.readFileSync(lyricfile).toString();
      console.log("Sending lyrics: "+lyrics);
      msg.reply('Sing along with ' + path.basename(audio, ".mp3") + ':\n\n' + lyrics);
    }else{
      msg.reply('Sorry, no lyrics :(');
    }
  }
  
  if (command.toUpperCase() == 'ABOUT') {
    msg.channel.send('The bot code was created by Andrew Lee (Alee#4277). Modified by Mike Fair (br8kpoint#2317). Written in Discord.JS and licensed with GPL-3.0.');
  }

  if (![config.botOwner].includes(msg.author.id)) return;

  // Bot owner exclusive

  if (command.toUpperCase() == 'JOIN') {
    msg.reply('Joining voice channel.');
    console.log('Connected to the voice channel.');
    playAudio();
  }

  if (command.toUpperCase() == 'RESUME') {
    msg.reply('Resuming music.');
    dispatcher.resume();
  }

  if (command.toUpperCase() == 'PAUSE') {
    msg.reply('Pausing music.');
    dispatcher.pause();
  }

  if (command.toUpperCase() == 'SKIP') {
    msg.reply('Skipping `' + audio + '`...');
    dispatcher.pause();
    dispatcher = null;
    playAudio();
  }

  if (command.toUpperCase() == 'RANDOM') {
    msg.reply('Setting mode to random');
    console.log('Setting mode to random');
    mode = "random";
  }

  if (command.toUpperCase() == 'SEQUENTIAL') {
    msg.reply('Setting mode to sequential');
    console.log('Setting mode to sequential');
    mode = "sequential";
  }
  if (command.toUpperCase() == 'LISTS') {
    playlists  = await (await globby("./music/**",{onlyDirectories:true})).map(item=>item.replace('./music/',""))
    msg.reply(`The following playlists are available:\n\nALL *play all files in ./music*\n${playlists.join('\n')}\n\n**Current playlist: ${playlist}**`);
    console.log(`The following playlists are available:\n\nALL *play all files in ./music*\n${playlists.join('\n')}\n\n**Current playlist: ${playlist}**`);
  }
  if (command.toUpperCase() == 'PLAYLIST') {
    /** wsa:PLAYLIST <LISTNAME>
     * <LISTNAME> is the desired playlist to switch to.
     */
    let cmdplaylist = msg.content.split(' ')[1]   // the playlist the user wants to play
    setPlayList(cmdplaylist,msg);
  }
  if (command.toUpperCase() == 'LEAVE') {
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
    msg.reply('Leaving voice channel.');
    console.log('Leaving voice channel.');
    fileData = "Now Playing: Nothing";
    fs.writeFile("now-playing.txt", fileData, (err) => { 
    if (err) 
    console.log(err); 
    }); 
    audio = "Not Playing";
    dispatcher.destroy();
    voiceChannel.leave();
  }

  if (command.toUpperCase() == 'STOP') {
    await msg.reply('Powering off...');
    fileData = "Now Playing: Nothing";
    await fs.writeFile("now-playing.txt", fileData, (err) => { 
    if (err) 
    console.log(err); 
    }); 
    const statusEmbed = new Discord.MessageEmbed()
    .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
    .setDescription(`That\'s all folks! Powering down ${bot.user.username}...`)
    .setColor('#0066ff')
    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    await statusChannel.send(statusEmbed);
    console.log('Powering off...');
    dispatcher.destroy();
    bot.destroy();
    process.exit(0);
  }

});
