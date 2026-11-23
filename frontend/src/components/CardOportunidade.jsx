import { Link } from 'react-router-dom';
import { MODALIDADES, formatarData } from '../api';
import { Badge } from './Layout';

export default function CardOportunidade({ op }) {
  const local = op.modalidade === 'REMOTA' ? 'De qualquer lugar' : `${op.cidade}${op.uf ? ' / ' + op.uf : ''}`;
  const restantes = Math.max(op.vagas - (op.aprovados || 0), 0);
  return (
    <Link to={`/oportunidades/${op.id}`} className="card card-op">
      <div className="card-op-topo">
        <Badge cor="azul">{op.causa}</Badge>
        <Badge cor={op.modalidade === 'REMOTA' ? 'roxo' : 'cinza'}>{MODALIDADES[op.modalidade]}</Badge>
      </div>
      <h3>{op.titulo}</h3>
      <p className="org">{op.organizacao}</p>
      <ul className="meta">
        <li>📍 {local}</li>
        {op.data_inicio && <li>📅 A partir de {formatarData(op.data_inicio)}</li>}
        {op.carga_horaria && <li>⏱ {op.carga_horaria}</li>}
      </ul>
      <p className="vagas">{restantes} {restantes === 1 ? 'vaga disponível' : 'vagas disponíveis'}</p>
    </Link>
  );
}
