import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import PricingListPage from './pages/PricingListPage';
import PricingWizardPage from './pages/PricingWizardPage';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/pricing" replace />} />
        <Route path="/pricing" element={<PricingListPage />} />
        <Route path="/pricing/new" element={<PricingWizardPage />} />
        <Route path="*" element={<Navigate to="/pricing" replace />} />
      </Route>
    </Routes>
  );
}
