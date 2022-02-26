// variable to hold db connection
let db;
// establish connection to IndexedDB
const request = indexedDB.open('budgeters-friend', 1);

request.onupgradeneeded = function(event) {
  // save a reference to the db
  const db = event.target.result;

  // create an objet store
  db.createObjectStore('new_trans', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // save ref to db in global variable
  db = event.target.result;

  // check if online and send data if yes
  if (navigator.onLine) {
    uploadTrans();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// if a new transaction is executed when no intenet connection, this saves the record
function saveRecord(record) {
  const transaction = db.transaction(['new_trans'], 'readwrite');

  const transObjectStore = transaction.objectStore('new_trans');

  transObjectStore.add(record);
};

function uploadTrans() {
  // open transaction on the db
  const transaction = db.transaction(['new_trans'], 'readwrite');

  // access the object store
  const transObjectStore = transaction.objectStore('new_trans');

  // get everything from the store and store it in a variable
  const getAll = transObjectStore.getAll();

  getAll.onsuccess = function() {
    // calls the api to create a single transaction if only one was stored
    if (getAll.result.length > 1 ) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_trans'], 'readwrite');

          const transObjectStore = transaction.objectStore('new_trans');

          transObjectStore.clear();

          alert('All saved transactions have been submitted');
        })
        .catch(err => {
          console.log(err);
        });
    }
  };
};

// listen for when app comes back online
window.addEventListener('online', uploadTrans);