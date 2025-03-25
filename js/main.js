new Vue({
    el: '#app',

    components: {
        CardForm: {
            template: `
                <div class="form-container">
                  <form @submit.prevent="handleSubmit">
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
                    <button type="submit">{{ isEditing ? 'Update Card' : 'Add Card' }}</button>
                    <button type="button" v-if="isEditing" @click="cancelEdit">Cancel</button>
                  </form>
                </div>
            `,

            data() {
                return {
                    newCard: {
                        title: '',
                        description: '',
                        deadline: ''
                    },
                    isEditing: false,
                    editIndex: null
                }
            },

            methods: {
                handleSubmit() {
                    if (this.isEditing) {
                        this.$emit('updateCard', { index: this.editIndex, card: {...this.newCard} });
                    } else {
                        this.$emit('addCard', {...this.newCard});
                    }
                    this.resetForm();
                },

                resetForm() {
                    this.newCard = {
                        title: '',
                        description: '',
                        deadline: ''
                    };
                    this.isEditing = false;
                    this.editIndex = null;
                },

                cancelEdit() {
                    this.resetForm();
                },

                setEditData(card, index) {
                    this.newCard = {
                        title: card.title,
                        description: card.description,
                        deadline: card.deadline
                    };
                    this.isEditing = true;
                    this.editIndex = index;
                }
            }
        },

        Card: {
            template: `
                <div class="card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.description }}</p>
                  <p>Дэдлайн: {{ card.deadline }}</p>
                  <p>Создано: {{ card.createdAt }}</p>
                  <p v-if="card.lastEditedAt">Последнее редактирование: {{ card.lastEditedAt }}</p>
                  
                  <div class="card-actions">
                    <button v-if="colIndex === 0" @click="$emit('edit', card, cardIndex)">Редактировать</button>
                    <button v-if="colIndex === 0" @click="$emit('delete', cardIndex)">Удалить</button>
                    <button v-if="colIndex > 0" @click="$emit('moveBack', card)">Вернуться</button>
                    <button v-if="colIndex < columns.length - 1" @click="$emit('moveForward', card)">Переместить вперед</button>
                  </div>
                </div>
            `,
            props: {
                card: Object,
                colIndex: Number,
                columns: Array,
                cardIndex: Number
            }
        }
    },

    data: {
        columns: [
            { name: 'Запланированные задачи', cards: [], maxCards: 3 },
            { name: 'Задачи в работе', cards: [], maxCards: 5 },
            { name: 'Тестирование', cards: [], maxCards: null },
            { name: 'Выполненные задачи', cards: [], maxCards: null }
        ]
    },

    methods: {
        saveState() {
            localStorage.setItem('appState', JSON.stringify({
                columns: this.columns
            }));
        },

        loadState() {
            const storedState = localStorage.getItem('appState');
            if (storedState) {
                try {
                    const parsedState = JSON.parse(storedState);
                    this.columns = parsedState.columns;
                } catch (e) {
                    console.error('Ошибка при разборе сохраненного состояния:', e);
                    localStorage.removeItem('appState');
                }
            }
        },

        addCard(newCard) {
            const card = {
                title: newCard.title,
                description: newCard.description,
                deadline: newCard.deadline,
                createdAt: new Date().toLocaleString(),
                lastEditedAt: null
            };

            this.columns[0].cards.push(card);
        },

        updateCard({index, card}) {
            const editedCard = this.columns[0].cards[index];
            editedCard.title = card.title;
            editedCard.description = card.description;
            editedCard.deadline = card.deadline;
            editedCard.lastEditedAt = new Date().toLocaleString();
        },

        deleteCard(colIndex, cardIndex) {
            this.columns[colIndex].cards.splice(cardIndex, 1);
        },

        moveCard(card, fromColumn, toColumn) {
            if (fromColumn.cards.includes(card)) {
                if (toColumn.maxCards === null || toColumn.cards.length < toColumn.maxCards) {
                    const cardIndex = fromColumn.cards.indexOf(card);
                    const movedCard = fromColumn.cards.splice(cardIndex, 1)[0];
                    toColumn.cards.push(movedCard);
                }
            }
        },

        editCard(card, index) {
            this.$refs.cardForm.setEditData(card, index);
        }
    },

    mounted() {
        this.loadState();
    },

    watch: {
        columns: {
            handler(newColumns) {
                this.saveState();
            },
            deep: true
        }
    },

    template: `
        <div>
          <CardForm 
            ref="cardForm"
            @addCard="addCard"
            @updateCard="updateCard"
          />
          
          <div class="column-container">
            <div v-for="(column, colIndex) in columns" :key="colIndex" class="column">
              <h2>{{ column.name }}</h2>
              <div v-for="(card, cardIndex) in column.cards" :key="card.title + cardIndex">
                <Card 
                  :card="card" 
                  :colIndex="colIndex" 
                  :cardIndex="cardIndex"
                  :columns="columns"
                  @moveBack="moveCard(card, column, columns[colIndex - 1])"
                  @moveForward="moveCard(card, column, columns[colIndex + 1])"
                  @edit="editCard"
                  @delete="deleteCard(colIndex, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      `
});