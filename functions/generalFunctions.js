function openPdf(pdfUrl) {
  // #toolbar=0 blendet in vielen Browsern Download-Optionen aus
  const pdfModal = document.getElementById("pdfModal");
  const pdfFrame = document.getElementById("pdfFrame");
  pdfFrame.src = pdfUrl + "#toolbar=0";
  pdfModal.style.display = "block";
  document.body.style.overflow = "hidden"; // Scrollen der Hauptseite stoppen
}

function renderArchiveNews(list, newsContainerId) {
  const container = document.getElementById(newsContainerId);
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>Keine Berichte gefunden.</p>";
    return;
  }

  list.forEach((item) => {
    if (item.date != "N/A") {
      let urlForMore = ``;
      if (item.url != "") {
        urlForMore = `<p><a href="${item.url}">Weiterlesen...</a></p>`;
      }
      const articleHtml =
        `
        <div class="news-item fade-in visible">
            <h3>${item.title}</h3>
            <p><strong>${item.date}</strong></p>
            <p>${item.text}</p>` +
        urlForMore +
        `
        </div>`;
      container.insertAdjacentHTML("beforeend", articleHtml);
    }
  });
}

function handleArchiveNewsFilters(
  sliderMin,
  sliderMax,
  searchElement,
  dateDisplayId,
  extraTextId,
  newsContainerId,
  archiveNewsMinDate,
  NEWS_LIST,
) {
  if (typeof sliderMin === "string") {
    sliderMin = document.getElementById(sliderMin);
  }
  if (typeof sliderMax === "string") {
    sliderMax = document.getElementById(sliderMax);
  }
  let searchTerm = null;
  try {
    searchTerm = searchElement.value.toLowerCase();
  } catch {
    searchTerm = document.getElementById(searchElement).value.toLowerCase();
  }
  const dateDisplay = document.getElementById(dateDisplayId);

  if (searchTerm === "#begrenzt") {
    const validItems = NEWS_LIST.filter(
      (item) => item.date && item.date !== "N/A",
    );
    const limitedList = validItems.slice(0, 3);
    dateDisplay.textContent = "Nur aktuellste Beiträge";
    document.getElementById(extraTextId).textContent =
      "Im Suchfeld clicken um Beitragsfilter zu aktivieren";
    renderArchiveNews(limitedList, newsContainerId);
    return;
  }

  document.getElementById(extraTextId).textContent = "";
  let valMin = Number.parseInt(sliderMin.value);
  let valMax = Number.parseInt(sliderMax.value);

  if (valMin >= valMax) {
    valMin = valMax - 1;
    sliderMin.value = valMin;
  }

  const startDate = new Date(archiveNewsMinDate);
  startDate.setDate(startDate.getDate() + valMin * 7);

  const endDate = new Date(archiveNewsMinDate);
  endDate.setDate(endDate.getDate() + valMax * 7);

  dateDisplay.textContent = `${startDate.toLocaleDateString(
    "de-DE",
  )} bis ${endDate.toLocaleDateString("de-DE")}`;

  let filteredNews = NEWS_LIST.filter((item) => {
    const itemDate = parseDate(item.date);

    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm) ||
      item.text.toLowerCase().includes(searchTerm);

    let matchesDate = false;
    if (itemDate) {
      matchesDate = itemDate >= startDate && itemDate <= endDate;
    }

    return matchesSearch && matchesDate;
  });
  renderArchiveNews(filteredNews, newsContainerId);
}

function resetArchiveNewsFilters(
  searchInputId,
  sliderMinId,
  sliderMaxId,
  dateDisplayId,
  extraTextId,
  newsContainerId,
  NEWS_LIST,
) {
  const searchInput = document.getElementById(searchInputId);
  searchInput.value = "#begrenzt";
  const sliderMin = document.getElementById(sliderMinId);
  const sliderMax = document.getElementById(sliderMaxId);
  sliderMin.value = 0;
  sliderMax.value = sliderMax.max;
  const minDate = initArchiveNewsFilters(NEWS_LIST, sliderMinId, sliderMaxId);
  handleArchiveNewsFilters(
    sliderMin,
    sliderMax,
    searchInput,
    dateDisplayId,
    extraTextId,
    newsContainerId,
    minDate,
    NEWS_LIST,
  );
}

function initArchiveNewsFilters(NEWS_LIST, sliderMinId, sliderMaxId) {
  const dates = NEWS_LIST.map((item) => parseDate(item.date))
    .filter((d) => d !== null)
    .sort((a, b) => a - b);

  let archiveNewsMinDate = null;
  let archiveNewsMaxDate = null;
  if (dates.length > 0) {
    archiveNewsMinDate = dates[0];
    archiveNewsMaxDate = dates[dates.length - 1];

    const diffWeeks = Math.ceil(
      (archiveNewsMaxDate - archiveNewsMinDate) / (1000 * 60 * 60 * 24 * 7),
    );

    const sliderMin = document.getElementById(sliderMinId);
    const sliderMax = document.getElementById(sliderMaxId);

    sliderMin.max = diffWeeks;
    sliderMax.max = diffWeeks;
    sliderMax.value = diffWeeks;
  }
  return archiveNewsMinDate;
}

function toggleArchiveNewsVisibility(
  toggleButtonId,
  wrapperId,
  sliderMinId,
  sliderMaxId,
  searchTermId,
  dateDisplayId,
  extraTextId,
  newsContainerId,
  NEWS_LIST,
) {
  const toggleButton = document.getElementById(toggleButtonId);
  const wrapper = document.getElementById(wrapperId);

  if (!toggleButton || !wrapper) return;

  const sliderMin = document.getElementById(sliderMinId);
  const sliderMax = document.getElementById(sliderMaxId);
  const minDate = initArchiveNewsFilters(NEWS_LIST, sliderMinId, sliderMaxId);

  toggleButton.addEventListener("click", function () {
    const isExpanding = wrapper.classList.contains("news-collapsed");
    wrapper.classList.toggle("news-collapsed");
    toggleButton.classList.toggle("active");

    if (isExpanding) {
      const searchInput = document.getElementById(searchTermId);
      handleArchiveNewsFilters(
        sliderMin,
        sliderMax,
        searchInput,
        dateDisplayId,
        extraTextId,
        newsContainerId,
        minDate,
        NEWS_LIST,
      );

      setTimeout(() => {
        wrapper.classList.add("visible");
      }, 10);
    }
  });
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === "N/A" || typeof dateStr !== "string") return null;

  const germanMatch = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (germanMatch) {
    return new Date(
      Number.parseInt(germanMatch[3]),
      Number.parseInt(germanMatch[2]) - 1,
      Number.parseInt(germanMatch[1]),
    );
  }

  const monthMap = {
    januar: 0,
    january: 0,
    februar: 1,
    february: 1,
    märz: 2,
    march: 2,
    april: 3,
    mai: 4,
    may: 4,
    juni: 5,
    june: 5,
    juli: 6,
    july: 6,
    august: 7,
    september: 8,
    oktober: 9,
    october: 9,
    november: 10,
    dezember: 11,
    december: 11,
  };

  const words = dateStr.toLowerCase().split(/[\s-]+/);
  let year = words.find((w) => w.match(/^\d{4}$/));
  let month = words.find((w) => monthMap.hasOwnProperty(w));

  if (year && month !== undefined) {
    return new Date(Number.parseInt(year), monthMap[month], 1);
  }

  return null;
}

function toggleGeschichteVisibility(geschichteToggleBtn, geschichteContainer) {
  const toggleButton = document.getElementById(geschichteToggleBtn);
  const content = document.getElementById(geschichteContainer);
  if (!toggleButton || !content) {
    return;
  }
  toggleButton.addEventListener("click", function () {
    content.classList.toggle("geschichte-collapsed");
    toggleButton.classList.toggle("active");
  });
}

function convertString(input) {
  let output = 1;
  for (const element of input) {
    output =
      ((output % (2 ^ (13 - 1))) + element.codePointAt(0)) *
      element.codePointAt(0);
  }
  return output;
}

function openMenu(mobileMenu, overlay, mobileToggle) {
  mobileMenu.showModal();
  mobileMenu.classList.add("active");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
  mobileToggle.classList.add("active");
  mobileToggle.setAttribute("aria-expanded", "true");
}

function closeMenu(mobileMenu, overlay, mobileToggle) {
  mobileMenu.close();
  requestAnimationFrame(() => {
    mobileMenu.classList.remove("active");
  });
  overlay.classList.remove("active");
  document.body.style.overflow = "";
  mobileToggle.classList.remove("active");
  mobileToggle.setAttribute("aria-expanded", "false");
}

function insertNavigationElements(
  template,
  contactBtn,
  memberBtn,
  contactStandard,
  mobileCTAButtons,
  desktopNav,
  footerLinks,
) {
  if (template && desktopNav) {
    const clone = template.content.cloneNode(true);
    desktopNav.prepend(clone);
    const ul = desktopNav.querySelector("ul");
    if (ul) {
      if (memberBtn) {
        ul.append(memberBtn.content.cloneNode(true));
      }
      if (contactBtn) {
        ul.append(contactBtn.content.cloneNode(true));
      }
    }
  }

  // Mobile Navigation
  if (template && mobileMenu) {
    const clone = template.content.cloneNode(true);
    mobileMenu.prepend(clone);

    // Add CTA buttons at the end
    if (mobileCTAButtons) {
      mobileMenu.appendChild(mobileCTAButtons.content.cloneNode(true));
    }
  }

  // Footer Navigation
  if (template && footerLinks) {
    const clone = template.content.cloneNode(true);
    footerLinks.append(clone);
    const ul = footerLinks.querySelector("ul");
    if (ul && contactStandard) {
      ul.append(contactStandard.content.cloneNode(true));
    }
  }
}

function setupMobileSubmenus(mobileMenu) {
  const submenuParents = mobileMenu.querySelectorAll(
    ".has-submenu > .submenu-toggle",
  );
  submenuParents.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      const li = this.closest(".has-submenu");
      const isOpen = li.classList.contains("open");

      // Close other open submenus
      mobileMenu.querySelectorAll(".has-submenu.open").forEach((item) => {
        if (item !== li) item.classList.remove("open");
      });

      li.classList.toggle("open");
      this.setAttribute("aria-expanded", String(!isOpen));
    });
  });
}

// Animation Observer
function observeFadeElements() {
  const fadeElements = document.querySelectorAll(".fade-in");
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);
  fadeElements.forEach((element) => {
    observer.observe(element);
  });
}
// (async () => {
//   let sampleJsonString = "Any text here";
//   let out = convertString(sampleJsonString);
//   console.log(out);
// })();
