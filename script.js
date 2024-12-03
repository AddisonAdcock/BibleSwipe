// Shared functionality for both pages
const books = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges",
    "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
    "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
    "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
    "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
    "1 John", "2 John", "3 John", "Jude", "Revelation"
  ];
  
  // Save current location to localStorage
  function saveProgress(book, chapter, verse) {
    localStorage.setItem("lastBook", book);
    localStorage.setItem("lastChapter", chapter);
    localStorage.setItem("lastVerse", verse);
  }
  
  // Load the last saved location from localStorage
  function loadLastProgress() {
    return {
      book: localStorage.getItem("lastBook") || "Genesis",
      chapter: parseInt(localStorage.getItem("lastChapter")) || 1,
      verse: parseInt(localStorage.getItem("lastVerse")) || 1,
    };
  }
  
  // Adjust font size to fit within the viewport
  function adjustFontSize() {
    const verseTextElement = document.getElementById("verse-text");
    const verseReferenceElement = document.getElementById("verse-reference");
  
    const containerHeight = window.innerHeight * 0.8;
    const containerWidth = window.innerWidth * 0.9;
  
    let fontSize = 2;
    verseTextElement.style.fontSize = `${fontSize}rem`;
    verseReferenceElement.style.fontSize = `${fontSize * 0.75}rem`;
  
    while (
      verseTextElement.scrollHeight > containerHeight ||
      verseTextElement.scrollWidth > containerWidth
    ) {
      fontSize -= 0.1;
      verseTextElement.style.fontSize = `${fontSize}rem`;
      verseReferenceElement.style.fontSize = `${fontSize * 0.75}rem`;
      if (fontSize <= 1) break;
    }
  }
  
  // Fetch the verse from the server
  async function fetchVerse(book, chapter, verse) {
    try {
      const response = await fetch(`bible/${book}/${chapter}/${verse}.json`);
      if (!response.ok) throw new Error("Verse not found");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  
  // Handle form submission for index.html
  function setupIndexForm() {
    const bookInput = document.getElementById("book-input");
    const chapterInput = document.getElementById("chapter-input");
    const verseInput = document.getElementById("verse-input");
    const suggestions = document.getElementById("suggestions");
    const form = document.getElementById("verse-form");
  
    // Pre-fill inputs with saved progress
    const lastProgress = loadLastProgress();
    bookInput.value = lastProgress.book;
    chapterInput.value = lastProgress.chapter;
    verseInput.value = lastProgress.verse;
  
    bookInput.addEventListener("input", () => {
      const input = bookInput.value.toLowerCase();
      suggestions.innerHTML = "";
      if (input) {
        books
          .filter((book) => book.toLowerCase().startsWith(input))
          .forEach((book) => {
            const suggestionItem = document.createElement("div");
            suggestionItem.classList.add("suggestion-item");
            suggestionItem.textContent = book;
            suggestionItem.addEventListener("click", () => {
              bookInput.value = book;
              suggestions.innerHTML = "";
              suggestions.style.display = "none";
            });
            suggestions.appendChild(suggestionItem);
          });
        suggestions.style.display = "block";
      } else {
        suggestions.style.display = "none";
      }
    });
  
    bookInput.addEventListener("blur", () => {
      setTimeout(() => {
        suggestions.style.display = "none";
      }, 200);
    });
  
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const book = bookInput.value.trim();
      const chapter = chapterInput.value.trim();
      const verse = verseInput.value.trim();
  
      if (book && chapter && verse) {
        saveProgress(book, chapter, verse);
        window.location.href = `read.html?book=${encodeURIComponent(book)}&chapter=${chapter}&verse=${verse}`;
      } else {
        alert("Please enter a valid book, chapter, and verse.");
      }
    });
  }
  
  // Handle verse navigation for read.html
  async function setupReadPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookParam = urlParams.get("book");
    const chapterParam = urlParams.get("chapter");
    const verseParam = urlParams.get("verse");
  
    const lastProgress = loadLastProgress();
    let currentBook = books.includes(bookParam) ? bookParam : lastProgress.book;
    let currentChapter = parseInt(chapterParam) || lastProgress.chapter;
    let currentVerse = parseInt(verseParam) || lastProgress.verse;
  
    async function loadVerse() {
      const data = await fetchVerse(currentBook, currentChapter, currentVerse);
  
      if (data) {
        document.getElementById("verse-text").innerText = data.text;
        document.getElementById("verse-reference").innerText = `${data.book} ${data.chapter}:${data.verse}`;
        saveProgress(currentBook, currentChapter, currentVerse);
        adjustFontSize();
      } else {
        nextBook();
      }
    }
  
    async function findLastChapter(book) {
      let chapter = 1;
      while (await fetchVerse(book, chapter, 1)) {
        chapter++;
      }
      return chapter - 1;
    }
  
    async function findLastVerse(book, chapter) {
      let verse = 1;
      while (await fetchVerse(book, chapter, verse)) {
        verse++;
      }
      return verse - 1;
    }
  
    function nextBook() {
      const currentBookIndex = books.indexOf(currentBook);
      if (currentBookIndex < books.length - 1) {
        currentBook = books[currentBookIndex + 1];
        currentChapter = 1;
        currentVerse = 1;
      } else {
        // Loop back to Genesis 1:1
        currentBook = "Genesis";
        currentChapter = 1;
        currentVerse = 1;
      }
      loadVerse();
    }
  
    async function nextVerse() {
      currentVerse++;
      const nextVerseData = await fetchVerse(currentBook, currentChapter, currentVerse);
      if (!nextVerseData) {
        currentChapter++;
        currentVerse = 1;
  
        const nextChapterData = await fetchVerse(currentBook, currentChapter, currentVerse);
        if (!nextChapterData) {
          nextBook();
        } else {
          loadVerse();
        }
      } else {
        loadVerse();
      }
    }
  
    async function prevVerse() {
      if (currentVerse > 1) {
        currentVerse--;
      } else if (currentChapter > 1) {
        currentChapter--;
        currentVerse = await findLastVerse(currentBook, currentChapter);
      } else {
        const currentBookIndex = books.indexOf(currentBook);
        if (currentBookIndex > 0) {
          currentBook = books[currentBookIndex - 1];
          currentChapter = await findLastChapter(currentBook);
          currentVerse = await findLastVerse(currentBook, currentChapter);
        } else {
          // Loop back to Revelation
          currentBook = "Revelation";
          currentChapter = await findLastChapter(currentBook);
          currentVerse = await findLastVerse(currentBook, currentChapter);
        }
      }
      loadVerse();
    }
  
    loadVerse();
  
    window.addEventListener("wheel", (e) => {
      if (e.deltaY > 0) {
        nextVerse();
      } else {
        prevVerse();
      }
    });
  
    let startY = 0;
    document.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY;
    });
  
    document.addEventListener("touchend", (e) => {
      const endY = e.changedTouches[0].clientY;
      if (startY > endY + 50) {
        nextVerse();
      } else if (startY < endY - 50) {
        prevVerse();
      }
    });
  }
  