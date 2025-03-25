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
                    editIndex: null,
                    editColIndex: null
                }
            },

            methods: {
                handleSubmit() {
                    if (this.isEditing) {
                        this.$emit('updateCard', {
                            colIndex: this.editColIndex,
                            cardIndex: this.editIndex,
                            card: {...this.newCard}
                        });
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
                    this.editColIndex = null;
                },

                cancelEdit() {
                    this.resetForm();
                },

                setEditData(card, colIndex, cardIndex) {
                    this.newCard = {
                        title: card.title,
                        description: card.description,
                        deadline: card.deadline
                    };
                    this.isEditing = true;
                    this.editIndex = cardIndex;
                    this.editColIndex = colIndex;
                }
            }
        },

        Card: {
            template: `
                <div class="card" :class="{ 'overdue': card.status === 'overdue', 'completed': card.status === 'completed' }">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.description }}</p>
                  <p>Дэдлайн: {{ card.deadline }}</p>
                  <p>Создано: {{ card.createdAt }}</p>
                  <p v-if="card.lastEditedAt">Последнее редактирование: {{ card.lastEditedAt }}</p>
                  <p v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</p>
                  <p v-if="card.status === 'overdue'" class="status-badge">ПРОСРОЧЕНО</p>
                  <p v-else-if="card.status === 'completed'" class="status-badge">ВЫПОЛНЕНО В СРОК</p>
                  
                  <div class="card-actions">
                    <button v-if="showEdit" @click="$emit('edit', card, colIndex, cardIndex)">Редактировать</button>
                    <button v-if="showDelete" @click="$emit('delete', colIndex, cardIndex)">Удалить</button>
                    <button v-if="showMoveForward" @click="$emit('moveForward', card)">Переместить вперед</button>
                    <button v-if="showReturnToWork" @click="$emit('returnToWork', card)">Вернуть в работу</button>
                  </div>
                </div>
            `,
            props: {
                card: Object,
                colIndex: Number,
                cardIndex: Number,
                columns: Array
            },
            computed: {
                showEdit() {
                    return this.colIndex < 3; // Редактирование доступно в первых трех столбцах
                },
                showDelete() {
                    return this.colIndex === 0; // Удаление только в первом столбце
                },
                showMoveForward() {
                    // Перемещение вперед из 1->2, 2->3, 3->4
                    return this.colIndex < this.columns.length - 1;
                },
                showReturnToWork() {
                    return this.colIndex === 2; // Кнопка возврата только для третьего столбца
                }
            }
        },
        ReturnReasonDialog: {
            template: `
                <div class="dialog-overlay" v-if="visible">
                    <div class="dialog">
                        <h3>Укажите причину возврата</h3>
                        <textarea v-model="returnReason" placeholder="Причина возврата..." required></textarea>
                        <div class="dialog-buttons">
                            <button @click="confirm">Подтвердить</button>
                            <button @click="cancel">Отмена</button>
                        </div>
                    </div>
                </div>
            `,
            props: {
                visible: Boolean
            },
            data() {
                return {
                    returnReason: ''
                }
            },
            methods: {
                confirm() {
                    if (this.returnReason.trim()) {
                        this.$emit('confirm', this.returnReason);
                        this.returnReason = '';
                    }
                },
                cancel() {
                    this.$emit('cancel');
                    this.returnReason = '';
                }
            }
        }
    },

    data: {
        columns: [
            { name: 'Запланированные задачи', cards: [], maxCards: 3 },
            { name: 'Задачи в работе', cards: [], maxCards: 5 },
            { name: 'Тестирование', cards: [], maxCards: null },
            { name: 'Выполненные задачи', cards: [], maxCards: null }
        ],
        showReturnDialog: false,
        selectedCardForReturn: null,
        selectedCardFromColumn: null
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
                lastEditedAt: null,
                status: null,
                returnReason: null
            };

            this.columns[0].cards.push(card);
        },

        updateCard({colIndex, cardIndex, card}) {
            const editedCard = this.columns[colIndex].cards[cardIndex];
            editedCard.title = card.title;
            editedCard.description = card.description;
            editedCard.deadline = card.deadline;
            editedCard.lastEditedAt = new Date().toLocaleString();
        },

        deleteCard(colIndex, cardIndex) {
            this.columns[colIndex].cards.splice(cardIndex, 1);
        },

        moveCard(card, fromColumnIndex, toColumnIndex, returnReason = null) {
            const fromColumn = this.columns[fromColumnIndex];
            const toColumn = this.columns[toColumnIndex];

            if (fromColumn.cards.includes(card)) {
                if (toColumn.maxCards === null || toColumn.cards.length < toColumn.maxCards) {
                    const cardIndex = fromColumn.cards.indexOf(card);
                    const movedCard = fromColumn.cards.splice(cardIndex, 1)[0];

                    // Обновляем статус для завершенных задач
                    if (toColumnIndex === 3) {
                        const deadline = new Date(movedCard.deadline);
                        const now = new Date();
                        movedCard.status = deadline < now ? 'overdue' : 'completed';
                    }

                    // Убираем причину возврата при перемещении вперед
                    if (fromColumnIndex === 1 && toColumnIndex === 2) {
                        movedCard.returnReason = null;
                    }

                    // Добавляем причину возврата если есть
                    if (returnReason) {
                        movedCard.returnReason = returnReason;
                    }

                    toColumn.cards.push(movedCard);
                }
            }
        },

        promptReturnToWork(card) {
            this.selectedCardForReturn = card;
            this.selectedCardFromColumn = 2; // Третий столбец
            this.showReturnDialog = true;
        },

        handleReturnConfirm(reason) {
            this.moveCard(this.selectedCardForReturn, this.selectedCardFromColumn, 1, reason);
            this.showReturnDialog = false;
        },

        handleReturnCancel() {
            this.showReturnDialog = false;
        },

        editCard(card, colIndex, cardIndex) {
            this.$refs.cardForm.setEditData(card, colIndex, cardIndex);
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
          
          <ReturnReasonDialog
            :visible="showReturnDialog"
            @confirm="handleReturnConfirm"
            @cancel="handleReturnCancel"
          />
          
          <div class="column-container">
            <div v-for="(column, colIndex) in columns" :key="colIndex" class="column">
              <h2>{{ column.name }}</h2>
              <p v-if="column.maxCards !== null">Макс. карточек: {{ column.maxCards }} (текущее: {{ column.cards.length }})</p>
              <div v-for="(card, cardIndex) in column.cards" :key="card.title + cardIndex + colIndex">
                <Card 
                  :card="card" 
                  :colIndex="colIndex" 
                  :cardIndex="cardIndex"
                  :columns="columns"
                  @edit="editCard"
                  @delete="deleteCard"
                  @moveForward="moveCard(card, colIndex, colIndex + 1)"
                  @returnToWork="promptReturnToWork"
                />
              </div>
            </div>
          </div>
        </div>
      `
});