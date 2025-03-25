new Vue({
    el: '#app',

    components: {
        CardForm: {
            template: `
        <div class="form-container">
          <form @submit.prevent="$emit('addCard', newCard)">
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
            <button type="submit">Add Card</button>
          </form>
        </div>
      `,
            data() {
                return {
                    newCard: {
                        title: '',
                        description: '',
                        deadline: ''
                    }
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
          
          <!-- Кнопки для перемещения карточки -->
          <button v-if="colIndex > 0" @click="$emit('moveBack', card)">Вернуться</button>
          <button v-if="colIndex < columns.length - 1" @click="$emit('moveForward', card)">Переместить вперед</button>
        </div>
      `,
            props: {
                card: Object,
                colIndex: Number,
                columns: Array
            }
        }
    },

    data: {
        columns: [
            { name: 'FirstColumn', cards: [], maxCards: 3 },
            { name: 'SecondColumn', cards: [], maxCards: 5 },
            { name: 'ThirdColumn', cards: [], maxCards: null }
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
        moveCard(card, fromColumn, toColumn) {
            if (fromColumn.cards.includes(card) && toColumn.cards.length < toColumn.maxCards) {
                fromColumn.cards.splice(fromColumn.cards.indexOf(card), 1);
                toColumn.cards.push(card);
            } else if (toColumn.maxCards == null) {
                fromColumn.cards.splice(fromColumn.cards.indexOf(card), 1);
                toColumn.cards.push(card);
            }
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
      <CardForm @addCard="addCard" />
      
      <div v-for="(column, colIndex) in columns" :key="colIndex" class="column">
        <h2>{{ column.name }}</h2>
        <div v-for="(card, cardIndex) in column.cards" :key="card.title + cardIndex">
          <Card 
            :card="card" 
            :colIndex="colIndex" 
            :columns="columns"
            @moveBack="moveCard(card, column, columns[colIndex - 1])"
            @moveForward="moveCard(card, column, columns[colIndex + 1])"
          />
        </div>
      </div>
    </div>
  `
});
