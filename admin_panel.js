document.addEventListener('DOMContentLoaded', function() {
    fetch('http://127.0.0.1:8001/elements')
        .then(response => response.json())
        .then(data => {
            const selector = document.getElementById('selector');

            function sendRequest(collectionName, arguments, command) {
                const requestData = {
                    collectionName: collectionName,
                    arguments: arguments,
                    command: command
                };

                console.log(requestData);
            
                fetch('http://127.0.0.1:8001/action/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Ответ от сервера:', data);
                })
                .catch(error => {
                    console.error('Ошибка отправки запроса:', error);
                });
            }

            function displayNames(selectedOption) {
                const listContainer = document.getElementById('list-container');
                const list = document.getElementById('list');
                list.innerHTML = '';
                if (data[selectedOption]) {
                    data[selectedOption].forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.textContent = item.name;

                        const editButton = document.createElement('button');
                        editButton.textContent = 'Изменить';
                        editButton.addEventListener('click', function() {
                            openModalForEdit(selectedOption, item.name);
                        });
                        listItem.appendChild(editButton);

                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Удалить';
                        deleteButton.addEventListener('click', function () {
                            let arguments = {}
                            arguments['name'] = item.name;
                            sendRequest(selectedOption, arguments, 'delete');
                        });
                        listItem.appendChild(deleteButton);

                        list.appendChild(listItem);
                    });
                    
                    const addButton = document.createElement('button');
                    addButton.textContent = 'Добавить';
                    addButton.addEventListener('click', function() {
                        openModalForAdd(selectedOption);
                    });
                    list.appendChild(addButton);

                    listContainer.style.display = 'block';
                } else {
                    listContainer.style.display = 'none';
                }
            }

            Object.keys(data).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                selector.appendChild(option);
            });

            selector.addEventListener('change', function() {
                const selectedOption = selector.value;
                displayNames(selectedOption);
            });

            function openModalForEdit(collectionName, recordName) {
                const modal = createModal();
                const modalContent = modal.querySelector('.modal-content');
                modal.style.display = 'block';
                
                // Получаем запись с помощью recordName
                const record = data[collectionName].find(item => item.name === recordName);
            
                // Создание формы для редактирования
                const form = document.createElement('form');
            
                // Добавляем поле recordName в форму
                const recordNameGroup = document.createElement('div');
                recordNameGroup.classList.add('form-group');
                const recordNameLabel = document.createElement('label');
                recordNameLabel.textContent = 'name';
                const recordNameInput = document.createElement('input');
                recordNameInput.type = 'text';
                recordNameInput.name = 'name';
                recordNameInput.value = recordName;
                recordNameGroup.appendChild(recordNameLabel);
                recordNameGroup.appendChild(recordNameInput);
                form.appendChild(recordNameGroup);
            
                // Итерация по свойствам объекта record.content
                for (const key in record.content) {
                    if (record.content.hasOwnProperty(key)) {
                        const group = document.createElement('div');
                        group.classList.add('form-group');
                        const label = document.createElement('label');
                        label.textContent = `${key}:`;
                
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.name = key; // Добавление атрибута name
                        input.value = record.content[key];
                
                        group.appendChild(label);
                        group.appendChild(input);
                        form.appendChild(group);
                    }
                }
            
                // Кнопка сохранения
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Сохранить';
                saveButton.addEventListener('click', function(event) {
                    event.preventDefault();
                
                    // Собираем данные из формы
                    const formData = new FormData(form);
                    const formDataObject = {};
                    formData.forEach((value, key) => {
                        formDataObject[key] = value;
                    });
                    
                    formDataObject['contentType'] = record.contentType;
                    formDataObject['oldName'] = recordName;

                    // Отправляем запрос на сервер
                    sendRequest(collectionName, formDataObject, 'update');
                
                    closeModal(modal);
                });
                form.appendChild(saveButton);
                
                modalContent.appendChild(form);
                document.body.appendChild(modal);
            }
            
            function openModalForAdd(collectionName) {
                const modal = createModal();
                const modalContent = modal.querySelector('.modal-content');
                modal.style.display = 'block';

                const record = data[collectionName][0]
                
                // Создание формы для добавления новой записи
                const form = document.createElement('form');
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Имя:';
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.name = 'name';
                form.appendChild(nameLabel);
                form.appendChild(nameInput);
                
                for (const key in record.content) {
                    if (record.content.hasOwnProperty(key)) {
                        const group = document.createElement('div');
                        group.classList.add('form-group');
                        const label = document.createElement('label');
                        label.textContent = `${key}:`;
            
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.name = key;
                        input.value = ""
            
                        group.appendChild(label);
                        group.appendChild(input);
                        form.appendChild(group);
                    }
                }

                // Кнопка добавления
                const addButton = document.createElement('button');
                addButton.textContent = 'Добавить';
                addButton.addEventListener('click', function(event) {
                    event.preventDefault();
                
                    // Собираем данные из формы
                    const formData = new FormData(form);
                    const formDataObject = {};
                    formData.forEach((value, key) => {
                        formDataObject[key] = value;
                    });

                    formDataObject['contentType'] = record.contentType;

                    // Отправляем запрос на сервер
                    sendRequest(collectionName, formDataObject, 'add');
                
                    closeModal(modal);
                });
                form.appendChild(addButton);
                
                modalContent.appendChild(form);
                document.body.appendChild(modal);
            }

            console.log('JSON данные успешно загружены и добавлены в селектор:', data);
        })
        .catch(error => console.error('Ошибка загрузки JSON:', error));

        function createModal() {
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.style.display = 'none';
            const modalContent = document.createElement('div');
            modalContent.classList.add('modal-content');
            const closeButton = document.createElement('span');
            closeButton.textContent = '×';
            closeButton.classList.add('close');
            closeButton.addEventListener('click', function() {
                closeModal(modal);
            });
            modalContent.appendChild(closeButton);
            modal.appendChild(modalContent);
            return modal;
        }
        
        function closeModal(modal) {
            modal.remove();
        }
});
