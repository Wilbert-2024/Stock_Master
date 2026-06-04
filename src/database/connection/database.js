import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("stokmaster.db");

export default db;
