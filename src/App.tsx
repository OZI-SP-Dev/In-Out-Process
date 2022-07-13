import { HashRouter } from 'react-router-dom';
import './App.css';
import Roles from './Roles';
import { AppHeader } from './components/AppHeader/AppHeader';
import { Route, Routes } from 'react-router-dom';
import Home from './Home';
import Item from './Item';
import { InForm } from './components/InForm/InForm';

function App() {
  return (
    <div>
    <AppHeader />
    <HashRouter>
    <Routes>
        <Route index element={<Home />}></Route>
        <Route path="roles" element={<Roles />}>
        </Route>
        <Route path="item/:itemNum" element={<Item />} />
        <Route path="new" element={<InForm />} />
    </Routes>
  </HashRouter>
     </div>
  );
}

export default App;
