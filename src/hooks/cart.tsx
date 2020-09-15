import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  const storeCartProducts = useCallback((cartProducts: Product[]) => {
    AsyncStorage.setItem('@GoMarketplace:cart', JSON.stringify(cartProducts));
  }, []);

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        const newProducts = [...products, { ...product, quantity: 1 }];

        setProducts(newProducts);
        storeCartProducts(newProducts);
        return;
      }

      const newProducts = products.map((p, index) => ({
        ...p,
        quantity: index === productIndex ? p.quantity + 1 : p.quantity,
      }));

      setProducts(newProducts);
      storeCartProducts(newProducts);
    },
    [products, storeCartProducts],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product => ({
        ...product,
        quantity: product.id === id ? product.quantity + 1 : product.quantity,
      }));

      setProducts(newProducts);
      storeCartProducts(newProducts);
    },
    [products, storeCartProducts],
  );

  const decrement = useCallback(
    async id => {
      const productSelected = products.find(product => product.id === id);

      if (!productSelected) {
        return;
      }

      if (productSelected.quantity === 1) {
        const newProducts = products.filter(product => product.id !== id);

        setProducts(newProducts);
        storeCartProducts(newProducts);
        return;
      }

      const newProducts = products.map(product => ({
        ...product,
        quantity: product.id === id ? product.quantity - 1 : product.quantity,
      }));

      setProducts(newProducts);
      storeCartProducts(newProducts);
    },
    [products, storeCartProducts],
  );

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
