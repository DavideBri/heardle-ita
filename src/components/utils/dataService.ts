import { getDayStr, getDayStrAsPath } from ".";
import { SongConfig } from "../game/SongConfig";
import { artists } from "../utils/constants";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";
import "./firebase";

interface Map {
    [key: string]: any
}

const DEFAULT_SONG = {
    day: "",
    songLength: 30,
    breaks: [1, 2, 4, 8, 16, 30],
    trackName: "Elisa Litoranea",
    others: ["Elisa Litoranea (con Matilda De Angelis)"],
    song: "Litoranea",
    artist: "Elisa",
    soundCloudLink: "https://soundcloud.com/elisa-official/litoranea-1",
    showSoundCloud: true,
    image: "https://i1.sndcdn.com/artworks-dr78ZwUE9K3r-0-t500x500.jpg"
};

const SONG_DATABASE: Map = {}

const setSong = (day: string, selectedSong: any) => {

    const database = getDatabase();

    let hardCodedSong = selectedSong;

    set(ref(database, "songs/"+ day), hardCodedSong) 
            
}

async function fetchSong(accessToken:string, artist: string): Promise<any> {

    var myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + accessToken);
        myHeaders.append("Content-Type", "application/json");

    return await fetch("https://api.spotify.com/v1/search?type=track&market=IT&q=" + artist, {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow'
    })
        .then(response => response.json())
        .then(response => response.tracks.items[Math.floor(Math.random() * response.tracks.items.length)])

}



export const getDailySong = (accessToken: string): Promise<any> => {
    const banWords = ["rmx","unplugged", "reprise","remaster", "live", "remix", "mix", "version", "edit", "remastered", "concert", "concerto", "live", "studio", "registrazione", "dal vivo", "strumentale", "session"];	// words to filter out
    let day = getDayStr()

    let artist = artists[Math.floor(Math.random() * artists.length)];
    let hardCodedSong: any;

    if (SONG_DATABASE[day]) {
        hardCodedSong = SONG_DATABASE[day];
    }

    return new Promise<SongConfig>(async (resolve, reject) => {

        let day = getDayStrAsPath();

        const database = getDatabase();

        let selectedSong: any;
        var value: any;
        do {
         selectedSong = await fetchSong(accessToken, artist);
         value = new RegExp(banWords.join('|')).test(selectedSong.name.toLowerCase());
        }while(selectedSong.preview_url != null && selectedSong.artists[0].name.toLowerCase() != artist && !value)
      

        /*console.log(selectedSong)
        console.log(selectedSong.artists[0].name.toLowerCase() + " " + artist)
        console.log(selectedSong.artists[0].name.toLowerCase() === artist)
        */

        let song = selectedSong.name.includes("-") ? selectedSong.name.substring(0, selectedSong.name.indexOf("-")) :
        selectedSong.name.includes("(") ? selectedSong.name.substring(0, selectedSong.name.indexOf("(")) : selectedSong.name;

        let trackname = selectedSong.artists[0].name + " " + selectedSong.name;

        trackname = trackname.replaceAll("å", "a");
        trackname = trackname.replaceAll("_", "");
        trackname = trackname.replaceAll(".", "");
        trackname = trackname.replaceAll("?", "");
        trackname = trackname.replaceAll("!", "");

        hardCodedSong = {
            day: day,
            songLength: 30,
            breaks: [1, 2, 4, 8, 16, 30],
            trackName: trackname,
            others: [selectedSong.artists[0].name + " " + song],
            song: selectedSong.name.indexOf("-") !== -1 ? selectedSong.name.substring(0, selectedSong.name.indexOf("-")) : selectedSong.name,
            artist: selectedSong.artists[0].name,
            soundCloudLink: selectedSong.preview_url,
            showSoundCloud: false,
            showSpotify: true,
            soundSpotifyLink: "https://open.spotify.com/embed/track/" + selectedSong.id,
            image: selectedSong.album.images[0].url
        };

 
        const songRef = ref(database, 'songs/' + day);
        
        onValue(songRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                resolve(data);
            } else {
                setSong(day, hardCodedSong)
                resolve(hardCodedSong)
            }
        }, (err) => {
            console.error(err);
            resolve(hardCodedSong)
        }, {
            onlyOnce: true
        });
        

    });
 
}
