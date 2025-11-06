
document.addEventListener('DOMContentLoaded', () => {
    const flashcard = document.getElementById('flashcard');
    const cardFront = document.querySelector('.card-front');
    const cardBack = document.querySelector('.card-back');
    const nextButton = document.getElementById('next-button');
    const categorySelector = document.getElementById('category-selector');
    const subCategorySelector = document.getElementById('subcategory-selector');

    let allEquipment = [];
    let equipment = [];
    let categories = [];
    let subCategories = new Set();

    const pageTitle = 'List_of_equipment_of_the_Russian_Ground_Forces';
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=sections&format=json&origin=*`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            categories = data.parse.sections;
            populateCategorySelector();
            loadEquipment(categories[0].index);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            cardFront.innerHTML = "Error";
            cardBack.innerHTML = "Could not fetch or parse data. See console for details.";
        });

    function populateCategorySelector() {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.index;
            option.textContent = category.line;
            categorySelector.appendChild(option);
        });
    }

    function updateSubCategorySelector() {
        subCategorySelector.innerHTML = '<option value="all">All</option>';
        if (subCategories.size > 0) {
            subCategories.forEach(subCategory => {
                const option = document.createElement('option');
                option.value = subCategory;
                option.textContent = subCategory;
                subCategorySelector.appendChild(option);
            });
            subCategorySelector.style.display = 'inline-block';
        } else {
            subCategorySelector.style.display = 'none';
        }
    }

    function loadEquipment(sectionIndex) {
        const sectionApiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageTitle}&prop=text&section=${sectionIndex}&format=json&origin=*`;
        fetch(sectionApiUrl)
            .then(response => response.json())
            .then(data => {
                const html = data.parse.text['*'];
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const tables = doc.querySelectorAll('.wikitable');
                allEquipment = [];
                subCategories = new Set();
                tables.forEach(table => {
                    const rows = table.querySelectorAll('tr');
                    let currentSubCategory = null;
                    rows.forEach(row => {
                        const th = row.querySelector('th[colspan="6"]');
                        if (th) {
                            currentSubCategory = th.textContent.trim();
                            subCategories.add(currentSubCategory);
                        } else {
                            const cells = row.querySelectorAll('td');
                            if (cells.length > 4) {
                                let imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
                                const img = cells[1].querySelector('img');
                                if (img && img.src) {
                                    imageUrl = 'https:' + img.getAttribute('src');
                                }

                                allEquipment.push({
                                    name: cells[0].textContent.trim(),
                                    type: cells[2].textContent.trim(),
                                    origin: cells[4].textContent.trim(),
                                    quantity: cells[3].textContent.trim(),
                                    details: cells[5] ? cells[5].textContent.trim() : 'N/A',
                                    image: imageUrl,
                                    subCategory: currentSubCategory
                                });
                            }
                        }
                    });
                });
                updateSubCategorySelector();
                filterEquipment();
                showRandomCard();
            })
            .catch(error => {
                console.error('Error fetching section content:', error);
            });
    }

    function filterEquipment() {
        const selectedSubCategory = subCategorySelector.value;
        if (selectedSubCategory === 'all') {
            equipment = allEquipment;
        } else {
            equipment = allEquipment.filter(item => item.subCategory === selectedSubCategory);
        }
    }

    function showRandomCard() {
        if (equipment.length === 0) {
            cardFront.innerHTML = "No data found";
            cardBack.innerHTML = "No equipment found in this category.";
            return;
        }

        const randomIndex = Math.floor(Math.random() * equipment.length);
        const randomEquipment = equipment[randomIndex];

        cardFront.innerHTML = `<img src="${randomEquipment.image}" alt="${randomEquipment.name}">`;
        cardBack.innerHTML = `
            <h3>${randomEquipment.name}</h3>
            <table>
                <tr>
                    <td><strong>Type:</strong></td>
                    <td>${randomEquipment.type}</td>
                </tr>
                <tr>
                    <td><strong>Origin:</strong></td>
                    <td>${randomEquipment.origin}</td>
                </tr>
                <tr>
                    <td><strong>Quantity:</strong></td>
                    <td>${randomEquipment.quantity}</td>
                </tr>
                <tr>
                    <td><strong>Details:</strong></td>
                    <td>${randomEquipment.details}</td>
                </tr>
            </table>
        `;

        flashcard.classList.remove('flipped');
    }

    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    nextButton.addEventListener('click', showRandomCard);

    categorySelector.addEventListener('change', () => {
        const selectedSectionIndex = categorySelector.value;
        loadEquipment(selectedSectionIndex);
    });

    subCategorySelector.addEventListener('change', () => {
        filterEquipment();
        showRandomCard();
    });
});
