function generateId() {
  const elementsSet = "0123456789abcdefghijklmnopqrstuvwxyz";
  const idSize = 30;
  let id = "";
  for (let i = 0; i < idSize; i++) {
    let index = Math.floor(Math.random() * elementsSet.length);
    let currentElement = elementsSet.charAt(index);
    id += currentElement;
  }

  return id;
}

module.exports = {
  generateId,
};
