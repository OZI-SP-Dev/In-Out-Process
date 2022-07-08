import { HashRouter, Link } from 'react-router-dom';
import './App.css';
import Roles from './Roles';
import { AppHeader } from './components/AppHeader/AppHeader';
import { Route, Routes } from 'react-router-dom';

function App() {
  return (
    <div>
    <AppHeader />
    <HashRouter>
    <Routes>
        <Route path="roles" element={<Roles />}>
        </Route>
    </Routes>
  </HashRouter>
     </div>
  );
}

export default App;
