import { LightningElement,wire, track } from 'lwc';
import getAccountRecords from '@salesforce/apex/Financial_Services_Account.getAccountRecords';
import updateRecords from '@salesforce/apex/Financial_Services_Account.updateRecords';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class FinancialServicesAccount extends LightningElement {
    @track data;
    @track sortDirection;
    @track sortBy;
    wiredRecords;
    draftValues = [];
    @track columns = [
        {
        label: 'Account Name', 
        fieldName: 'accountIdForURL', 
        type: 'url', 
        sortable: "true",
        typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' }
            
        }, {
            label: 'Account Owner',
            fieldName: 'OwnerName',
            sortable: "true",
            editable: true
        }, {
            label: 'Phone',
            fieldName: 'Phone',
            type: 'phone',
            editable: true
        }, {
            label: 'Website',
            fieldName: 'Website',
            editable: true,
            type: 'url',
        },{
            label: 'Annual Revenue',
            fieldName: 'AnnualRevenue',
            type: 'currency',
            editable: true
        },
    ];

    @wire(getAccountRecords)
    contacts(result) {
        this.wiredRecords = result;
        if (result.data) {
           /* this.data = result.data;
            this.error = undefined; */

            let accountData = [];
            result.data.forEach(account => {
               console.log('DATA 1 --> '+JSON.stringify(account));
               let accountRecords = {};
               accountRecords.Name = account.Name;
               accountRecords.accountIdForURL = '/' + account.Id;
               accountRecords.OwnerName = account.Owner.Name;
               accountRecords.Phone = account.Phone;
               accountRecords.Website = account.Website;
               accountRecords.AnnualRevenue = account.AnnualRevenue;
               accountRecords.Id = account.Id;
               accountData.push(accountRecords);
            });
            this.data = accountData;

        } else if (result.error) {
            this.error = result.error;
            this.data = undefined;
        }
    }

    handleSortdata(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(event.detail.fieldName, event.detail.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.data));
        let keyValue = (a) => {
            return a[fieldname];
        };
        let isReverse = direction === 'asc' ? 1: -1;
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : '';
            y = keyValue(y) ? keyValue(y) : '';
            return isReverse * ((x > y) - (y > x));
        });
        this.data = parseData;
    }

    async handleUpdate( event ) {
        const updatedFields = event.detail.draftValues;
        console.log('Updated Value--> '+JSON.stringify(updatedFields));

        await updateRecords( { data: updatedFields } )
        .then( result => {
            console.log( JSON.stringify( "Apex update result: " + result ) );
            this.showToastMessage('Success','Account(s) updated','success');
            
            refreshApex( this.wiredRecords ).then( () => {
                this.draftValues = [];
            });        

        }).catch( error => {
            console.log( 'Error is ' + JSON.stringify( error ) );
            this.showToastMessage('Error updating or refreshing records',error.body.message,'error');
        });

    }

    showToastMessage(title,message,variant){
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }

}