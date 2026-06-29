import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
// import Dashboard from "./pages/Dashboard";
import NotFound from "./Pages/NotFound";
import Home from "./Pages/Home";
import AdminAdd from "./Pages/Admins/AdminAdd";
import Admin from "./Pages/Admins/Admin";
import Layout from "./components/Layout";
import Country from "./Pages/Country/Country";
import CountryAdd from "./Pages/Country/CountryAdd";
import City from "./Pages/City/City";
import CityAdd from "./Pages/City/CityAdd";
import Zone from "./Pages/Zone/Zone";
import ZoneAdd from "./Pages/Zone/ZoneAdd";
import CategoryAdd from "./Pages/Category/CategoryAdd";
import Category from "./Pages/Category/Category";
import SubCategoryAdd from "./Pages/SubCategory/SubCategoryAdd";
import SubCategory from "./Pages/SubCategory/SubCategory";
import Branches from "./Pages/Branches/Branches";
import BranchesAdd from "./Pages/Branches/BranchesAdd";
import Addons from "./Pages/Addons/Addons";
import AddonsAdd from "./Pages/Addons/AddonsAdd";
import AddonsCat from "./Pages/AddonsCat/AddonsCat";
import AddonsCatAdd from "./Pages/AddonsCat/AddonsCatAdd";
import DeliveryZone from "./Pages/DeliveryZone/DeliveryZone";
import DeliveryZoneAdd from "./Pages/DeliveryZone/DeliveryZoneAdd";
import Food from "./Pages/Food/Food";
import FoodAdd from "./Pages/Food/FoodAdd";
import Setting from "./Pages/Branches/Setting";
import SettingAdd from "./Pages/Branches/SettingAdd";
import Cuisine from "./Pages/Cuisine/Cuisine";
import CuisineAdd from "./Pages/Cuisine/CuisineAdd";
import BrancheMenu from "./Pages/BrancheMenu/BrancheMenu";
import BrancheMenuAdd from "./Pages/BrancheMenu/BrancheMenuAdd";
import Permission from "./Pages/Permission/Permission";
import PermissionAdd from "./Pages/Permission/PermissionAdd";
import PaymentMetod from "./Pages/PaymentMetod/PaymentMetod";
import PaymentMetodAdd from "./Pages/PaymentMetod/PaymentMetodAdd";
import Transaction from "./Pages/Transaction/Transaction";
import Order from "./Pages/Order/Order";
import WalletR from "./Pages/Branches/WalletR";
import IngredientCategory from "./Pages/IngredientCategory/IngredientCategory";
import IngredientCategoryAdd from "./Pages/IngredientCategory/IngredientCategoryAdd";
import Ingredients from "./Pages/Ingredients/Ingredients";
import IngredientsAdd from "./Pages/Ingredients/IngredientsAdd";
import IngredientsFoods from "./Pages/IngredientCategory/IngredientsFoods";
import OrderDetails from "./Pages/Order/OrderDetails";
import OrdersList from "./Pages/Order/OrdersList";
import Mykeeto from "./Pages/Mykeeto/mykeeto";
import PublicRoute from "./components/PublicRoute";
import QR from "./Pages/QR/QR";
import QRAdd from "./Pages/QR/QRAdd";
import Image from "./Pages/Image/Image";
import ImageAdd from "./Pages/Image/ImageAdd";
import Social from "./Pages/Social/Social";
import SocialAdd from "./Pages/Social/SocialAdd";
import Invoice from "./Pages/Invoice/Invoice";
import Profile from "./Pages/Profile/Profile";
import Discount from "./Pages/Discount/Discount";
import DiscountAdd from "./Pages/Discount/DiscountAdd";
import Coupon from "./Pages/Coupon/Coupon";
import CouponAdd from "./Pages/Coupon/CouponAdd";
import Rating from "./Pages/Rating/Rating";
import Popup from "./Pages/Popup/Popup";
import PopupAdd from "./Pages/Popup/PopupAdd";
import Slider from "./Pages/Slider/Slider";
import SliderAdd from "./Pages/Slider/SliderAdd";
import SettingPage from "./Pages/Setting/Setting";
import SettingPageAdd from "./Pages/Setting/SettingAdd";
import Policy from "./Pages/Policy/Policy";
import PolicyAdd from "./Pages/Policy/PolicyAdd";
import Dashboard from "./Pages/Dashboard";
import ExpenseCategories from "./Pages/ExpenseCategories/expense-categories";
import ExpenseCategoriesAdd from "./Pages/ExpenseCategories/expense-categoriesAdd";
import Expense from "./Pages/Expense/expense";
import ExpenseAdd from "./Pages/Expense/expenseAdd";
import Cashiers from "./Pages/Cashier/Cashier";
import CashierAdd from "./Pages/Cashier/CashierAdd";
const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    )
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout /> {/* استخدمي Layout هنا بدلاً من Home لتنظيم الصفحة */}
      </ProtectedRoute>
    ),
    children: [
      {
        index: true, // ليعرض صفحة Home عند الدخول على "/" مباشرة
        element: <Home />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />
      },
      {
        path: "admins",
        element: <Admin />,
      },
      {
        path: "admins/add",
        element: <AdminAdd />,
      },
      {
        path: "admins/edit/:id",
        element: <AdminAdd />,
      },
      {
        path: "countries",
        element: <Country />,
      },
      {
        path: "countries/add",
        element: <CountryAdd />,
      },
      {
        path: "countries/edit/:id",
        element: <CountryAdd />,
      },
      {
        path: "cities",
        element: <City />,
      },
      {
        path: "cities/add",
        element: <CityAdd />,
      },
      {
        path: "cities/edit/:id",
        element: <CityAdd />,
      },
      {
        path: "zones",
        element: <Zone />,
      },
      {
        path: "zones/add",
        element: <ZoneAdd />,
      },
      {
        path: "zones/edit/:id",
        element: <ZoneAdd />,
      },
      {
        path: "categories",
        element: <Category />,
      },
      {
        path: "categories/add",
        element: <CategoryAdd />,
      },
      {
        path: "categories/edit/:id",
        element: <CategoryAdd />,
      },
      {
        path: "sub-categories",
        element: <SubCategory />,
      },
      {
        path: "sub-categories/add",
        element: <SubCategoryAdd />,
      },
      {
        path: "sub-categories/edit/:id",
        element: <SubCategoryAdd />,
      },
      {
        path: "branches",
        element: <Branches />,
      },
      {
        path: "branches/add",
        element: <BranchesAdd />,
      },
      {
        path: "branches/edit/:id",
        element: <BranchesAdd />,
      },
      {
        path: "branches/setting/:id",
        element: <Setting />,
      },
      {
        path: "branches/setting/edit/:id",
        element: <SettingAdd />,
      },
      {
        path: "addons",
        element: <Addons />,
      },
      {
        path: "addons/add",
        element: <AddonsAdd />,
      },
      {
        path: "addons/edit/:id",
        element: <AddonsAdd />,
      },
      {
        path: "addons-categories",
        element: <AddonsCat />,
      },
      {
        path: "addons-categories/add",
        element: <AddonsCatAdd />,
      },
      {
        path: "addons-categories/edit/:id",
        element: <AddonsCatAdd />,
      },
      {
        path: "mykeeto",
        element: <Mykeeto />,
      },
      {
        path: "delivery-zones",
        element: <DeliveryZone />,
      },
      {
        path: "delivery-zones/add",
        element: <DeliveryZoneAdd />,
      },
      {
        path: "delivery-zones/edit/:id",
        element: <DeliveryZoneAdd />,
      },
      {
        path: "foods",
        element: <Food />,
      },
      {
        path: "foods/add",
        element: <FoodAdd />,
      },
      {
        path: "foods/edit/:id",
        element: <FoodAdd />,
      },
      {
        path: "cuisines",
        element: <Cuisine />,
      },
      {
        path: "cuisines/add",
        element: <CuisineAdd />,
      },
      {
        path: "cuisines/edit/:id",
        element: <CuisineAdd />,
      },
      {
        path: "branches/branch_menu/:restaurantId",
        element: <BrancheMenu />,
      },
      {
        path: "branches/branch_menu/add",
        element: <BrancheMenuAdd />,
      },
      {
        path: "branches/branch_menu/edit/:id",
        element: <BrancheMenuAdd />,
      },
      {
        path: "permissions",
        element: <Permission />,
      },
      {
        path: "permissions/add",
        element: <PermissionAdd />,
      },
      {
        path: "permissions/edit/:id",
        element: <PermissionAdd />,
      },
      {
        path: "payment-methods",
        element: <PaymentMetod />,
      },
      {
        path: "payment-methods/add",
        element: <PaymentMetodAdd />,
      },
      {
        path: "payment-methods/edit/:id",
        element: <PaymentMetodAdd />,
      },
      {
        path: "branches/transaction/:restaurantId",
        element: <Transaction />,
      },
      {
        path: "orders",
        element: <Order />,
      },
      {
        path: "orders/details/:orderId",
        element: <OrderDetails />,
      },
      {
        path: "orders/pending",
        element: <OrdersList status="pending" />,
      },
      {
        path: "orders/accepted",
        element: <OrdersList status="accepted" />,
      },
      {
        path: "orders/preparing",
        element: <OrdersList status="preparing" />,
      },
      {
        path: "orders/delivered",
        element: <OrdersList status="delivered" />,
      },
      {
        path: "orders/out-delivery",
        // ملحوظة: اتأكد إن الـ API بياخدها "out-delivery" بالشرطة ولا "out_delivery" وعدلها في الـ status على أساسه
        element: <OrdersList status="out-delivery" />,
      },
      {
        path: "orders/cancelled",
        element: <OrdersList status="cancelled" />,
      },
      {
        path: "orders/rejected",
        element: <OrdersList status="rejected" />,
      },
      {
        path: "orders/refunded", // تم تعديل الإسبيلنج من refuned لـ refunded
        element: <OrdersList status="refunded" />,
      },

      {
        path: "branches/wallet/:restaurantId",
        element: <WalletR />,
      },
      {
        path: "ingredient-category",
        element: <IngredientCategory />,
      },
      {
        path: "ingredient-category/add",
        element: <IngredientCategoryAdd />,
      },
      {
        path: "ingredient-category/edit/:id",
        element: <IngredientCategoryAdd />,
      },
      {
        path: "ingredients",
        element: <Ingredients />,
      },
      {
        path: "ingredients/add",
        element: <IngredientsAdd />,
      },
      {
        path: "ingredients/edit/:id",
        element: <IngredientsAdd />,
      },
      {
        path: "ingredients/food/:categoryId",
        element: <IngredientsFoods />,
      },
      {
        path: "qr",
        element: <QR />,
      },
      {
        path: "qr/add",
        element: <QRAdd />,
      },
      {
        path: "qr/edit/:id",
        element: <QRAdd />,
      },
      {
        path: "image",
        element: <Image />,
      },
      {
        path: "image/add",
        element: <ImageAdd />,
      },
      {
        path: "image/edit/:id",
        element: <ImageAdd />,
      },
      {
        path: "social",
        element: <Social />,
      },
      {
        path: "social/add",
        element: <SocialAdd />,
      },
      {
        path: "social/edit/:id",
        element: <SocialAdd />,
      },
      {
        path: "invoice",
        element: <Invoice />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "discount",
        element: <Discount />,
      },
      {
        path: "discount/add",
        element: <DiscountAdd />,
      },
      {
        path: "discount/edit/:id",
        element: <DiscountAdd />,
      },
      {
        path: "coupon",
        element: <Coupon />,
      },
      {
        path: "coupon/add",
        element: <CouponAdd />,
      },
      {
        path: "coupon/edit/:id",
        element: <CouponAdd />,
      },
      {
        path: "rating",
        element: <Rating />,
      },
      {
        path: "popup",
        element: <Popup />,
      },
      {
        path: "popup/add",
        element: <PopupAdd />,
      },
      {
        path: "popup/edit/:id",
        element: <PopupAdd />,
      },
      {
        path: "slider",
        element: <Slider />,
      },
      {
        path: "slider/add",
        element: <SliderAdd />,
      },
      {
        path: "slider/edit/:id",
        element: <SliderAdd />,
      },
      {
        path: "setting",
        element: <SettingPage />,
      },
      {
        path: "setting/edit/:id",
        element: <SettingPageAdd />,
      },
      {
        path: "policy",
        element: <Policy />,
      },
      {
        path: "policy/add",
        element: <PolicyAdd />,
      },
      {
        path: "policy/edit/:id",
        element: <PolicyAdd />,
      },
      {
        path: "expense-categories",
        element: <ExpenseCategories />
      },
      {
        path: "expense-categories/add",
        element: <ExpenseCategoriesAdd />
      },
      {
        path: "expense-categories/edit/:id",
        element: <ExpenseCategoriesAdd />
      },
      {
        path: "expense",
        element: <Expense />
      },
      {
        path: "expense/add",
        element: <ExpenseAdd />
      },
      {
        path: "expense/edit/:expenseId",
        element: <ExpenseAdd />
      },

      {
        path: "cashiers",
        element: <Cashiers />,
      },
      {
        path: "cashiers/add",
        element: <CashierAdd />,
      },
      {
        path: "cashiers/edit/:id",
        element: <CashierAdd />,
      },
    ],
  },


  {
    path: "*",
    element: <NotFound />,
  },
]);
export default router;
