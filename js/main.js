new Vue({
    el: '#app',

    data: {
        columns: [
            { name: 'FirstColumn', cards: [], maxCards: 3 },
            { name: 'SecondColumn', cards: [], maxCards: 5 },
            { name: 'ThirdColumn', cards: [], maxCards: null }
        ],
        newCard: {
            title: '',
            description: '',
            deadline: '',
            items: ['', '', '']
        },
        isLocked: false
    },

    methods: {
        editCard(card, title, description, deadline) {
            card.title = title;
            card.description = description;
            card.deadline = deadline;
            card.lastEditedAt = new Date().toLocaleString();
        },


        moveCard(card, fromColumn, toColumn) {
            if (fromColumn.cards.includes(card) && toColumn.cards.length < toColumn.maxCards) {
                fromColumn.cards.splice(fromColumn.cards.indexOf(card), 1);
                toColumn.cards.push(card);
            } else if (toColumn.maxCards == null) {
                fromColumn.cards.splice(fromColumn.cards.indexOf(card), 1);
                toColumn.cards.push(card);
            }
        },

        checkFirstColumnCards() {
            if (this.isLocked) return;

            for (const card of this.columns[0].cards) {
                const totalItems = card.items.length;
                const completedItems = card.items.filter(item => item.completed).length;

                if (completedItems / totalItems > 0.5 && completedItems < totalItems) {
                    this.moveCard(card, this.columns[0], this.columns[1]);
                }
            }
        },

        checkCompletion(card) {
            const totalItems = card.items.length;
            const completedItems = card.items.filter(item => item.completed).length;

            if (completedItems === totalItems) {
                card.completedAt = new Date().toLocaleString();
                this.moveCard(card, this.columns[1], this.columns[2]);
                this.isLocked = false;
            } else if (completedItems / totalItems > 0.5 && completedItems < totalItems) {
                if (this.columns[1].cards.length < this.columns[1].maxCards) {
                    this.moveCard(card, this.columns[0], this.columns[1]);
                } else {
                    this.isLocked = true;
                }
            }
        },

        addCard() {
            const validItems = this.newCard.items.filter(item => item.trim() !== '');

            if (validItems.length >= 3 && validItems.length <= 5 && this.columns[0].cards.length < this.columns[0].maxCards) {
                const newCard = {
                    title: this.newCard.title,
                    description: '', // Добавьте описание
                    deadline: '', // Добавьте дэдлайн
                    createdAt: new Date().toLocaleString(), // Дата создания
                    lastEditedAt: null, // Дата последнего редактирования
                    items: validItems.map(item => ({ text: item, completed: false }))
                };

                this.columns[0].cards.push(newCard);
                this.resetForm();
            } else {
                alert('Введите от 3 до 5 пунктов');
            }
        },

        resetForm() {
            this.newCard = {
                title: '',
                items: ['', '', '']
            };
        },

        addItem() {
            if (this.newCard.items.length < 5) {
                this.newCard.items.push('');
            }
        },

        saveState() {
            localStorage.setItem('appState', JSON.stringify({
                columns: this.columns,
                isLocked: this.isLocked
            }));
        },

        loadState() {
            const storedState = localStorage.getItem('appState');
            if (storedState) {
                try {
                    const parsedState = JSON.parse(storedState);
                    this.columns = parsedState.columns;
                    this.isLocked = parsedState.isLocked;
                } catch (e) {
                    console.error('Ошибка при разборе сохраненного состояния:', e);
                    localStorage.removeItem('appState');
                }
            }
        },

        clearAllCards() {
            this.columns.forEach(column => {
                column.cards = [];
            });
            this.isLocked = false;
            this.saveState();
        }
    },

    watch: {
        'newCard.items': {
            handler(newItems) {
                if (newItems.length < 5 && newItems[newItems.length - 1]) {
                    this.addItem();
                }
            },
            deep: true
        },

        columns: {
            handler(newColumns) {
                if (!this.isLocked) {
                    this.checkFirstColumnCards();
                }
                this.saveState();
            },
            deep: true
        },

        isLocked: function(newVal) {
            this.saveState();
        }
    },

    mounted() {
        this.loadState();
    },

    computed: {
        itemRequired() {
            return this.newCard.items.map((item, index) => index < 3 || item.trim() !== '');
        }
    },

    template: `
    <div>
      <div class="form-container">
        <form @submit.prevent="addCard">
          <div>
            <label for="title">Title:</label>
            <input type="text" id="title" v-model="newCard.title" required>
          </div>
          <div>
            <label for="description">Description:</label>
            <textarea id="description" v-model="newCard.description"></textarea>
          </div>
          <div>
            <label for="deadline">Deadline:</label>
            <input type="date" id="deadline" v-model="newCard.deadline">
          </div>
          <div v-for="(item, index) in newCard.items" :key="index">
            <label :for="'item-' + index">Item {{ index + 1 }}:</label>
            <input type="text" :id="'item-' + index" v-model="newCard.items[index]" :required="itemRequired[index]">
          </div>
          <button type="submit">Add Card</button>
        </form>
      </div>

      <div v-for="(column, colIndex) in columns" :key="colIndex" class="column">
        <h2>{{ column.name }}</h2>
        <div v-for="(card, cardIndex) in column.cards" :key="card.title + cardIndex" class="card">
          <h3>{{ card.title }}</h3>
          <p>{{ card.description }}</p>
          <p>Дэдлайн: {{ card.deadline }}</p>
          <p>Создано: {{ card.createdAt }}</p>
          <p v-if="card.lastEditedAt">Последнее редактирование: {{ card.lastEditedAt }}</p>
          <form @submit.prevent="editCard(card, card.title, card.description, card.deadline)">
            <input type="text" v-model="card.title">
            <textarea v-model="card.description"></textarea>
            <input type="date" v-model="card.deadline">
            <button type="submit">Сохранить изменения</button>
          </form>
          <ul>
            <li v-for="(item, itemIndex) in card.items" :key="itemIndex">
              <input type="checkbox" 
                     v-model="item.completed" 
                     @change="checkCompletion(card)" 
                     :disabled="colIndex === 0 && isLocked || colIndex === 2">
              {{ item.text }}
            </li>
          </ul>
          <p v-if="card.completedAt">Completed at: {{ card.completedAt }}</p>
        </div>
      </div>
      <p v-if="isLocked">Первый столбец заблокирован. Завершите одну из карточек во втором столбце.</p>
    </div>
  `,
});
