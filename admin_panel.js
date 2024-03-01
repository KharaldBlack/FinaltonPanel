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
                        listItem.classList.add('list-item');

                        const nameColumn = document.createElement('div');
                        nameColumn.textContent = item.name;
                        nameColumn.classList.add('column1');
                        listItem.appendChild(nameColumn);

                        const editButtonColumn = document.createElement('div');
                        editButtonColumn.classList.add('column2');
                        const editButton = document.createElement('button');
                        editButton.textContent = 'Изменить';
                        editButton.addEventListener('click', function() {
                            openModalForEdit(selectedOption, item.name);
                        });
                        editButtonColumn.appendChild(editButton);
                        listItem.appendChild(editButtonColumn);

                        const deleteButtonColumn = document.createElement('div');
                        deleteButtonColumn.classList.add('column2');
                        const deleteButton = document.createElement('button');
                        deleteButton.textContent = 'Удалить';
                        deleteButton.addEventListener('click', function () {
                            let arguments = {}
                            arguments['name'] = item.name;
                            sendRequest(selectedOption, arguments, 'delete');
                        });
                        deleteButtonColumn.appendChild(deleteButton);
                        listItem.appendChild(deleteButtonColumn);
            
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
                option.textContent = vocab[key];
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
            
                const record = data[collectionName].find(item => item.name === recordName);
            
                const form = document.createElement('form');
            
                const recordNameGroup = document.createElement('div');
                recordNameGroup.classList.add('form-group');
                const recordNameLabel = document.createElement('label');
                recordNameLabel.textContent = vocab["name"];
                const recordNameInput = document.createElement('input');
                recordNameInput.type = 'text';
                recordNameInput.name = 'name';
                recordNameInput.value = recordName;
                recordNameGroup.appendChild(recordNameLabel);
                recordNameGroup.appendChild(recordNameInput);
                form.appendChild(recordNameGroup);
            
                let contentPreview; // Объявляем переменную contentPreview здесь
            
                for (const key in record.content) {
                    if (record.content.hasOwnProperty(key)) {
                        const group = document.createElement('div');
                        group.classList.add('form-group');
                        const label = document.createElement('label');
                        label.textContent = vocab[key];
                        group.appendChild(label);
                        
                        if (key === 'html') {
                            const trixInput = document.createElement('input');
                            trixInput.setAttribute('type', 'hidden');
                            trixInput.setAttribute('name', key);
                        
                            const trixEditor = document.createElement('trix-editor');
                            trixEditor.setAttribute('input', key);

                            trixEditor.addEventListener('trix-initialize', function(event) {
                                event.target.editor.loadHTML(record.content[key]);
                            });
                        
                            trixEditor.addEventListener('trix-change', function(event) {
                                const editorContent = event.target.value;
                                trixInput.value = editorContent;
                            });
                        
                            trixEditor.addEventListener('trix-editor-change', function(event) {
                                const editorContent = event.target.editor.getDocument().toString();
                                trixInput.value = editorContent;
                            });
                        
                            trixEditor.value = record.content[key]; // Установка начального значения редактора
                        
                            group.appendChild(trixEditor);
                            group.appendChild(trixInput);
                        } else {
                            const input = document.createElement('input');
                            input.type = 'text';
                            input.name = key;
                            input.value = record.content[key];
                            group.appendChild(input);

                            if (key === 'content') {
                                input.addEventListener('input', function (event) {
                                    updateContentPreview(event.target.value);
                                });
                
                                const contentLabel = document.createElement('label');
                                contentLabel.textContent = 'Предпросмотр контента';
                                group.appendChild(contentLabel);
                                contentPreview = document.createElement('div');
                                contentPreview.id = 'content-preview';
                                group.appendChild(contentPreview);
                            }
                        }

                        form.appendChild(group);
                    }
                }
            
                const saveButton = document.createElement('button');
                saveButton.textContent = 'Сохранить';
                saveButton.addEventListener('click', function(event) {
                    event.preventDefault();
            
                    const formData = new FormData(form);
                    const formDataObject = {};
                    formData.forEach((value, key) => {
                        if (key === 'html') {
                            const trixEditor = document.querySelector('trix-editor');
                            const editorDocument = trixEditor.editor.element.innerHTML;
                            console.log(editorDocument);
                            formDataObject['html'] = editorDocument;
                        } else {
                            formDataObject[key] = value;
                        }
                    });
                    
                    formDataObject['contentType'] = record.contentType;
                    formDataObject['oldName'] = recordName;
            
                    sendRequest(collectionName, formDataObject, 'update');
            
                    closeModal(modal);
                });
                form.appendChild(saveButton);
                
                modalContent.appendChild(form);
                document.body.appendChild(modal);
            
                const contentInput = form.querySelector('input[name="content"]');
                if (contentInput) {
                    updateContentPreview(contentInput.value, contentPreview);
                }
            }
            
            
            function openModalForAdd(collectionName) {
                const modal = createModal();
                const modalContent = modal.querySelector('.modal-content');
                modal.style.display = 'block';

                const record = data[collectionName][0]
                
                const form = document.createElement('form');
                const nameLabel = document.createElement('label');
                nameLabel.textContent = vocab["name"];
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
                        label.textContent = vocab[key];
            
                        const input = document.createElement('input');
                        input.type = 'text';
                        input.name = key;
                        input.value = ""

                        group.appendChild(label);
                        group.appendChild(input);

                        if (key === 'content') {
                            input.addEventListener('input', function (event) {
                                updateContentPreview(event.target.value);
                            });

                            const contentLabel = document.createElement('label');
                            contentLabel.textContent = 'Предпросмотр контента';
                            group.appendChild(contentLabel);
                            const contentPreview = document.createElement('div');
                            contentPreview.id = 'content-preview';
                            group.appendChild(contentPreview);
                        }

                        if (key === 'html') {

                        }

                        form.appendChild(group);
                    }
                }

                const addButton = document.createElement('button');
                addButton.textContent = 'Добавить';
                addButton.addEventListener('click', function(event) {
                    event.preventDefault();
                
                    const formData = new FormData(form);
                    const formDataObject = {};
                    formData.forEach((value, key) => {
                        formDataObject[key] = value;
                    });

                    formDataObject['contentType'] = record.contentType;

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

    function updateContentPreview(url) {
        const contentPreview = document.getElementById('content-preview');
        contentPreview.innerHTML = '';
    
        const contentType = checkContentType(url);
    
        if (contentType === 'video') {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.width = '560';
            iframe.height = '315';
            iframe.allowFullscreen = true;
            contentPreview.appendChild(iframe);
        } else if (contentType === 'image') {
            const image = document.createElement('img');
            image.src = url;
            image.style.maxWidth = '70%';
            contentPreview.appendChild(image);
        } else {
            clearContentPreview();
        }
    }

    function clearContentPreview() {
        const contentPreview = document.getElementById('content-preview');
        contentPreview.innerHTML = '';
    }

    function checkContentType(url) {
        const extension = url.split('.').pop().toLowerCase();
    
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv'];
    
        if (imageExtensions.includes(extension)) {
            return 'image';
        } else if (videoExtensions.includes(extension) || url.includes('youtube')) {
            return 'video';
        } else {
            return 'unknown';
        }
    }

    vocab = {
        contactsHead: "Контакты",
        currentStage: "Текущий статус",
        lessonVideo: "Видеоуроки",
        partnerLogos: "Логотипы партнёров",
        name: "Название",
        content: "Медиа",
        desc: "Описание",
        stage: "Стадия проекта",
        address: "Адрес",
        telephone: "Телефон",
        news: "Новости",
        title: "Заголовок",
        source: "Источник",
        html: "Текст новости"
    }
});
