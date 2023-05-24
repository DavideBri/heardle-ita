import { getDatabase, ref, set, get, update, remove} from "firebase/database";
import { uid } from "uid";
import './firebase';
import { TIME_TO_DELETE } from "../game/Constants";

const db = getDatabase();

function getDB() {
    return db;
}

async function setUser(user: string, score: any) {

    var u = uid(16);
    localStorage.setItem("uid", u);
    localStorage.setItem("user", user);
    
    await set(ref(db, "users/" + u), score);

    return u;
}

const getUsers = async () => {

    return await get(ref(db,"users/"));

}

const getUserByUid = async (uid: any) => {

    return await get(ref(db,"users/" + uid));

}


async function updateUserByUid(uid: any, score: any) {
    await update(ref(db, "users/" + uid), {score: score, timestamp: new Date().getTime()});
}

async function resetAllScoreOfUsers() {
    await get(ref(db, "users/")).then((snapshot) => {
        snapshot.forEach((u) => {
            if(u.val().timestamp != undefined) {
                if(new Date().getTime() - u.val().timestamp >=  TIME_TO_DELETE) {
                    localStorage.setItem("firstTime", "false");
                    localStorage.removeItem("Game");
                    remove(ref(db,"users/" + u.key));
                }
                update(ref(db,"users/" + u.key), {score: 0})
            }
           
        })
    });
}



export {getDB, setUser, getUsers, getUserByUid, updateUserByUid, resetAllScoreOfUsers};