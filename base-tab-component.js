////////////////////////////////////////////////////////////////////////////////
// Base Tab Class
class BaseTabComponent {
    onMounted(props, state) {
        this.query.select('review').subscribe(review => {
            this.service.setInputFields(this.$$('select'), review);
            this.update(); // notify other reactive parts to update: e.g. calc
        });
    }
    onUpdated(props, state) {
        const found = this.config.readOnlyComponents.find(item => item === this.root.tagName.toLowerCase());
        if (found) {
            this.service.lockInputFields(this.$$('form select'));
        }
    }
}

export default BaseTabComponent;