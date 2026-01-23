import fs from "fs";

const data = JSON.parse(
  fs.readFileSync("./server/data/bookmarks.json", "utf8"),
);

function findNamesWithChildren(obj, path = "") {
  const names = [];
  if (obj.children && obj.children.length > 0) {
    names.push({ name: obj.name, path });
    obj.children.forEach((child, index) => {
      names.push(...findNamesWithChildren(child, path + "/" + obj.name));
    });
  }
  return names;
}

const namesWithChildren = data.flatMap((item) => findNamesWithChildren(item));

console.log("Names with children:");
namesWithChildren.forEach((item) => console.log(item.name));
