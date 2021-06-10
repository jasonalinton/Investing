<template>
    <div class="boge-table col" :style="{ height: tableHeight }">
        <div class="row">
            <div class="col">
                <table class="transfer table table-dark table-hover">
                    <thead class="thead-light">
                        <tr>
                            <th class="d-none d-md-table-cell"></th>
                            <th>Time</th>
                            <th>Total</th>
                            <th>Amount</th>
                            <th>Price</th>
                            <th class="d-none d-md-table-cell">TxHash</th>
                        </tr>
                    </thead>
                    <tbody is="transition-group" name="transfer-list" v-cloak>
                        <tr v-for="(transfer, index) in transfers" :key="transfer.id" :class="transfer.type" :data-sender="transfer.senderAddress" :data-reciever="transfer.receiverAddress">
                            <td class="d-none d-md-table-cell center">{{ index + 1 }}</td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span :style="{ 'margin-bottom': '2px' }">{{ date(transfer.datetime) }}</span>
                                    <span>{{ time(transfer.datetime) }}</span>
                                </div>
                            </td>
                            <!-- Amount (Value BNB) -->
                            <td>
                                <div class="d-flex flex-column">
                                    <span :style="{ 'margin-bottom': '2px' }">{{ Number(transfer.bnbAmount.toFixed(4)).toLocaleString() }} BNB ({{ transfer.bnbUnitValue}})</span>
                                    <span>${{ Number(transfer.priceTotal.toFixed(2)).toLocaleString() }}</span>
                                </div>
                            </td>
                            <!-- DOGE Amount -->
                            <td class="center">
                                {{ Number(transfer.bogeAmount.toFixed(2)).toLocaleString() }} BOGE
                            </td>
                            <!-- Price/Token -->
                            <td class="center">
                                ${{ transfer.priceUnit.toFixed(2) }}
                            </td>
                            <!-- txHash -->
                            <td class="d-none d-md-table-cell">
                                <a :href="getTransactionLink(transfer.txHash)" target="_blank">{{ transfer.txHash }}</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import date from 'date-and-time';
import { io } from "socket.io-client";

export default {
    name: "TransferTable",
    components: {
  },
    props: {
        tableHeight: String,
        txFromAddress: String,
    },
    data: function () {
        return {
            transfers: [],
            shouldLog: false,
        };
    },
    created: function () {
        start(this);
        initSocket(this);
    },
    computed: {},
    methods: {
        getTransfers: getTransfers,
        date: function (datetime) {
            return datetime.toLocaleDateString();
        },
        time: function (datetime) {
            return datetime.toLocaleTimeString();
        },
        getTransactionLink: function (txHash) {
            return "https://bscscan.com/tx/" + txHash;
        },
    },
};

function start(self) {
    var startDatetime = date.addDays(new Date(), -2);
        self.getTransfers(startDatetime, null)
            .then(res => {
                setTransfers(self, res.data.data.getBogeTransferRange);
            });
}

function initSocket(self) {
    self.socket = io("http://localhost:3050");
    self.socket.on('transfer-added', (transfer) => {
        transfer.datetime = new Date(Number(transfer.datetime));
        self.transfers.splice(0, 0, transfer);
    });
}

async function getTransfers(startDatetime, endDatetime) {
    startDatetime = (startDatetime) ? `"${startDatetime.toJSON()}"` : `null`;
    endDatetime = (endDatetime) ? `"${endDatetime.toJSON()}"` : `null`;

    var data = {
        query: `
        mutation {
            getBogeTransferRange(
                startDatetime: ${startDatetime}, 
                endDatetime: ${endDatetime}) {
                    id
                    datetime
                    type
                    bnbAmount
                    bogeAmount
                    priceUnit
                    priceTotal
                    senderAddress
                    receiverAddress
                    txHash
            }
            }
        `
    }
    return axios.post('http://localhost:4000/graphql', data);
}

function setTransfers(self, transfers) {
    let transfers_temp = []
    // Remove bad transfers
    transfers.forEach(transfer => {
        if (transfer.priceUnit >= 0 && transfer.priceUnit <= 10) {
            transfer.id = Number(transfer.id);
            transfer.datetime = new Date(Number(transfer.datetime));
            transfers_temp.push(transfer);
        }
    })
    self.transfers = transfers_temp.sort((a, b) => b.datetime - a.datetime);
}

</script>

<style>

[v-cloak] {
    display: none;
}

.transfer-list-leave-to, .transfer-list-enter {
    opacity: 0;
    transform: translateY(30px);
}

.transfer-list-enter-active, .transfer-list-leave-active {
    transition: all 1s;
}

td.center {
    font-size: 14px;
    vertical-align: middle;
}

table.transfer tr {
    font-size: 12px;
}

table.transfer td {
    padding: 4px !important;
}

table.transfer th:nth-child(1) {
    width: 20px;
}

table.transfer th:nth-child(2) {
    width: 100px;
}

table.transfer th:nth-child(3) {
    width: 200px;
}

table.transfer th:nth-child(4) {
    width: 50px;
}

table.transfer th:nth-child(5) {
    width: 75px;
}

table.transfer th:last-child {
    width: 100px;
}

table.transfer tr {
    font-size: 14px;
    line-height: 16px;
}

table.transfer tr.buy {
    color: #35b522 !important;
}

table.transfer tr.sell {
    color: #ff0f23 !important;
}

table.transfer td {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

table.transfer tr[data-sender="0xfd345014ed667bb07eb26345e66addc9e8164b3b"] td,
table.transfer tr[data-reciever="0xfd345014ed667bb07eb26345e66addc9e8164b3b"] td,
table.transfer tr[data-sender="0x003c2f2dbcd1a57c081155c09aa72ba349da3752"] td,
table.transfer tr[data-reciever="0x003c2f2dbcd1a57c081155c09aa72ba349da3752"] td,
table.transfer tr[data-sender="0xf2FE653B6F00AaA96Dfb373eD30d569656EbeE21"] td,
table.transfer tr[data-reciever="0xf2FE653B6F00AaA96Dfb373eD30d569656EbeE21"] td,
table.transfer tr[data-sender="0xdac5ee9e4e1d0a1a923241400dd84cf1df77d732"] td,
table.transfer tr[data-reciever="0xdac5ee9e4e1d0a1a923241400dd84cf1df77d732"] td  {
    background-color: #444c53;
}
</style>
