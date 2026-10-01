import { CircleAlert, SearchX, type LucideIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { ChoiceList, SearchField, type ChoiceOption } from '../../components/fields'
import { Icon } from '../../components/Icon'
import { EmptyState } from '../../components/layout'
import { plural } from '../../lib/format'
import { matchesSearch } from './search'

export interface PickOption extends ChoiceOption {
  /** Texto usado na busca (nome, empresa, endereço). Padrão: o rótulo. */
  searchText?: string
}

interface PickSearch {
  label: string
  placeholder: string
  emptyTitle: string
  emptyDescription: string
}

/** Erro mostrado quando a lista não está visível (sem resultado ou vazia). */
function LooseError({ message }: { message: string }) {
  return (
    <p className="field__error t-small new-pick__error" role="alert">
      <Icon icon={CircleAlert} size={16} />
      {message}
    </p>
  )
}

/**
 * Etapa de escolha única com busca opcional. A busca ignora acento e
 * maiúscula; sem resultado, mostra um estado vazio com "Limpar busca".
 */
export function PickStep({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  search,
  empty,
}: {
  name: string
  legend: string
  options: PickOption[]
  value: string | null
  onChange: (value: string) => void
  error?: string
  search?: PickSearch
  /** Quando não há nenhuma opção cadastrada. */
  empty: { icon: LucideIcon; title: string; description: string }
}) {
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const visible = search ? options.filter((o) => matchesSearch(o.searchText ?? o.label, query)) : options
  const searching = query.trim().length > 0

  return (
    <div className="new-pick">
      {search && options.length > 0 && (
        <SearchField ref={searchRef} value={query} onChange={setQuery} label={search.label} placeholder={search.placeholder} />
      )}
      {search && (
        <p className="visually-hidden" role="status">
          {searching ? plural(visible.length, 'resultado', 'resultados') : ''}
        </p>
      )}

      {options.length === 0 ? (
        <>
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
          {error && <LooseError message={error} />}
        </>
      ) : visible.length === 0 ? (
        <>
          <EmptyState
            icon={SearchX}
            title={search?.emptyTitle ?? 'Nada encontrado'}
            description={search?.emptyDescription}
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setQuery('')
                  requestAnimationFrame(() => searchRef.current?.focus())
                }}
              >
                Limpar busca
              </Button>
            }
          />
          {error && <LooseError message={error} />}
        </>
      ) : (
        <ChoiceList
          name={name}
          legend={legend}
          hideLegend
          required
          options={visible}
          value={value}
          onChange={onChange}
          error={error}
        />
      )}
    </div>
  )
}
