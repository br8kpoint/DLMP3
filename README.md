# DLMP3 Bot (Discord.JS Local MP3)
A Discord bot that plays local mp3 audio tracks. Written in Discord.JS.

[Video Tutorial](https://www.youtube.com/watch?v=7X3FAhYW31I)

(Originally for Alee's birthday)

If there's anything wrong, feel free to make a fork and put a pull request.

# Configuration
Make a new file called `config.json`.
```
{
    "token": "token_here",
    "prefix": "dl:",
    "botOwner": "your_user_id_here",
    "statusChannel": "channel_id",
    "voiceChannel": "voice_channel_id",
    "mode":"sequential",
    "playlist":"playlist_directory_to_load_at_start_up"
}
```

Add your own audio files using the mp3 file extension to the `music` folder.

You can organize them in subdirectories and the directory names will become playlists.

You can also load lyrics in text files of the same name as the mp3 files only they have the extension .txt and the singalong command will display the luryics for the song in the `statusChannel`

Launch the bot using `node bot.js` in terminal.

# Help Command
```
Public Only
-----------
help - Displays commands.
ping - Pong!
git - Links to the source repo.
playing - Tells you what it's playing at the moment.
singalong - Display lyrics of the song (if available)
about - About the bot.

Bot Owner Only
--------------
join - Joins voice chat.
resume - Resumes music.
pause - Pauses music.
skip - Skips the audio track.
leave - Leaves voice chat.
stop - Stops bot.
sequential - Set mode to sequential for going through the list
random - Set mode to random - will choose song randomly after playing a song
lists - list all playlists avaialble
playlist <listname> - set the playlist to <listname>
```
