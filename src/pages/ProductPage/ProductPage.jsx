import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import data from "../../assets/data.json";
import { storagePropsManager } from "../../utils/storageManager";
import { STORAGE_KEY_NAMES } from "../../constants";
import { RecentListPage } from "./RecentListPage";
import { ProductDetailPage } from "./ProductDetailPage";

class ProductPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      products: data,
      target: this.onGetStorageItem(STORAGE_KEY_NAMES.SELECTED_ITEM) || null,
      selectedBrands: this.makeBrands(data),
      isInterested: false,
      timeStamp: new Date().setHours(24, 0, 0, 0),
      radioGroup: {
        notSelected: false,
        lastViewed: false,
        lowPriced: false,
      },
      isOpen: false,
    };
  }

  onOpenModal = () => {
    this.setState(pre => ({
      ...pre,
      isOpen: true,
    }));
  };

  onCloseModal = () => {
    this.setState(pre => ({
      ...pre,
      isOpen: false,
    }));
  };

  onGetStorageItem = key => {
    return storagePropsManager.getItemProps(key) || [];
  };

  onChange = (e, index = null) => {
    const name = e.target.name;
    switch (name) {
      case "selectedBrands":
        this.setState(pre => ({
          ...pre,
          [name]: pre.selectedBrands.map((c, i) => (index === i ? { ...c, selected: !c.selected } : c)),
        }));
        break;
      case "isInterested":
        this.setState(pre => ({
          ...pre,
          [name]: !pre[name],
        }));
        break;
    }
  };

  onFilter = () => {
    this.onCheckTime(STORAGE_KEY_NAMES.RECENT_CHECKED);
    this.onCheckTime(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM);
    let filterProducts = this.state.products;
    filterProducts = this.onSort(filterProducts);
    const isChecked = this.state.selectedBrands.some(p => p.selected === true);

    if (this.state.isInterested && this.onGetStorageItem(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM)) {
      filterProducts = filterProducts.filter(
        product => !this.onGetStorageItem(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM).some(notPro => product.title === notPro.title),
      );
    }
    if (isChecked) {
      filterProducts = filterProducts.filter(product => {
        return this.state.selectedBrands.some(c => c.brandName === product.brand && c.selected);
      });
    }

    return filterProducts;
  };

  onGetLastViewedProduts = () => {
    return this.onGetStorageItem(STORAGE_KEY_NAMES.RECENT_CHECKED);
  };

  onSort = filterProducts => {
    let sortCondition;
    const sortNames = this.state.radioGroup;
    for (const name in sortNames) {
      if (sortNames[name] === true) {
        sortCondition = name;
        break;
      }
    }

    let sortedProducts;
    let recentProducts;
    let restProducts;

    switch (sortCondition) {
      case "lastViewed":
        recentProducts = this.onGetLastViewedProduts().reverse();
        restProducts = filterProducts.filter(p => (recentProducts ? recentProducts.every(rp => rp.title !== p.title) : true));
        sortedProducts = [...recentProducts, ...restProducts];
        break;
      case "lowPriced":
        sortedProducts = filterProducts.sort((a, b) => {
          return a.price - b.price;
        });
        break;
      default:
        sortedProducts = filterProducts;
        break;
    }
    return sortedProducts;
  };

  handleRadio = e => {
    let radioGroup = {};

    this.setState(pre => {
      const preradioGroup = {
        ...pre.radioGroup,
      };
      radioGroup = Object.fromEntries(Object.entries(preradioGroup).map(([key, val]) => [key, false]));
      radioGroup[e.target.value] = e.target.checked;
      return {
        ...pre,
        radioGroup,
      };
    });
  };

  makeBrands = products => {
    const brandNames = new Set(products.map(product => product.brand));
    const selectedBrands = [...brandNames].map(name => ({
      brandName: name,
      selected: false,
    }));
    return selectedBrands;
  };

  isBlock = item => {
    this.onCheckTime(STORAGE_KEY_NAMES.RECENT_CHECKED);
    this.onCheckTime(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM);
    return this.onGetStorageItem(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM).some(product => product.title === item.title);
  };

  onClick = item => {
    this.setState(pre => ({
      ...pre,
      target: item,
    }));
    storagePropsManager.setItemProps(STORAGE_KEY_NAMES.SELECTED_ITEM, item);
  };

  generateRandomItem = item => {
    this.onCheckTime(STORAGE_KEY_NAMES.RECENT_CHECKED);
    this.onCheckTime(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM);
    let num = Math.floor(Math.random() * data.length);
    return num === data.findIndex(i => i.title === item.title) &&
      data.filter(item => this.onGetStorageItem(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM).includes(item))
      ? this.generateRandomItem(item)
      : data[num];
  };

  onGetRandomItem = item => {
    const randomItem = this.generateRandomItem(item);
    this.setState(pre => ({
      ...pre,
      target: randomItem,
    }));

    storagePropsManager.setItemProps(STORAGE_KEY_NAMES.SELECTED_ITEM, randomItem);
    this.onSetCheckedItem(randomItem);
  };

  onSetNotInterestedItem = item => {
    let timeStamp = this.state.timeStamp;
    const withTimeStamp = this.onGetStorageItem(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM).concat({ ...item, timeStamp });
    storagePropsManager.setItemProps(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM, withTimeStamp);

    this.onGetRandomItem(item);
  };

  onCheckTime = storageKey => {
    let timeStamp = this.state.timeStamp;
    const hasToFilter = this.onGetStorageItem(storageKey);
    const filterOldData = hasToFilter.filter(item => timeStamp === item.timeStamp);
    storagePropsManager.setItemProps(storageKey, filterOldData);
  };

  onSetCheckedItem = item => {
    this.onCheckTime(STORAGE_KEY_NAMES.RECENT_CHECKED);
    this.onCheckTime(STORAGE_KEY_NAMES.NOT_INTERESTED_ITEM);

    let timeStamp = this.state.timeStamp;

    const recentList = this.onGetStorageItem(STORAGE_KEY_NAMES.RECENT_CHECKED).filter(data => data.title !== item.title);
    const recentClicked = recentList.concat([{ ...item, timeStamp }]);
    storagePropsManager.setItemProps(STORAGE_KEY_NAMES.RECENT_CHECKED, recentClicked);
  };

  render() {
    const filterProducts = this.onFilter();

    return (
      <Switch>
        <Route exact path="/">
          <Redirect to="/recentList" />
        </Route>
        <Route
          path="/recentList"
          render={routeProps => (
            <RecentListPage
              isBlock={this.isBlock}
              onChange={this.onChange}
              isInterested={this.state.isInterested}
              selectedBrands={this.state.selectedBrands}
              abc={filterProducts}
              onClick={this.onClick}
              onSetCheckedItem={this.onSetCheckedItem}
              radioGroup={this.state.radioGroup}
              handleRadio={this.handleRadio}
              {...routeProps}
            />
          )}
        ></Route>
        <Route
          path="/product"
          render={routeProps => (
            <ProductDetailPage
              isBlock={this.isBlock}
              target={this.state.target}
              notInterested={this.state.notInterested}
              onSetNotInterestedItem={this.onSetNotInterestedItem}
              onGetRandomItem={this.onGetRandomItem}
              {...routeProps}
            />
          )}
        ></Route>
      </Switch>
    );
  }
}

export default ProductPage;
