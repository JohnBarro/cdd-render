import * as FileSystem from "expo-file-system";

const RNFS = {
  DocumentDirectoryPath: FileSystem.documentDirectory,
  readFile: async (filePath) => {
    return await FileSystem.readAsStringAsync(filePath);
  },
  writeFile: async (filePath, data) => {
    return await FileSystem.writeAsStringAsync(filePath, data);
  },
  unlink: async (filePath) => {
    return await FileSystem.deleteAsync(filePath, { idempotent: true });
  },
};

export default RNFS;
