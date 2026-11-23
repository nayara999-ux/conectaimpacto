import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { useAuth } from './AuthContext';
import Inicio from './pages/Inicio';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Oportunidades from './pages/Oportunidades';
import DetalheOportunidade from './pages/DetalheOportunidade';
import MinhasCandidaturas from './pages/MinhasCandidaturas';
import Perfil from './pages/Perfil';
import PainelOng from './pages/PainelOng';
import FormOportunidade from './pages/FormOportunidade';
import Candidatos from './pages/Candidatos';

function Protegida({ perfil, children }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/entrar" replace />;
  if (perfil && usuario.tipo !== perfil) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/oportunidades" element={<Oportunidades />} />
        <Route path="/oportunidades/:id" element={<DetalheOportunidade />} />
        <Route path="/minhas-candidaturas" element={<Protegida perfil="VOLUNTARIO"><MinhasCandidaturas /></Protegida>} />
        <Route path="/perfil" element={<Protegida><Perfil /></Protegida>} />
        <Route path="/painel" element={<Protegida perfil="ORGANIZACAO"><PainelOng /></Protegida>} />
        <Route path="/painel/nova" element={<Protegida perfil="ORGANIZACAO"><FormOportunidade /></Protegida>} />
        <Route path="/painel/:id/editar" element={<Protegida perfil="ORGANIZACAO"><FormOportunidade /></Protegida>} />
        <Route path="/painel/:id/candidatos" element={<Protegida perfil="ORGANIZACAO"><Candidatos /></Protegida>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
