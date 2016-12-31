import { h, Component } from 'preact';

import Header from './Header';
import DomainList from './DomainList';

export default class App extends Component {
  constructor () {
    super();

    this.setCurrent = this.setCurrent.bind(this);
    this.handleSearch = this.handleSearch.bind(this);

    this.state = {
      domains: [],
      filteredDomains: [],
      current: {
        domain: '',
        start: '',
        end: '',
        status: '',
        definitions: []
      },
      search: ''
    };
  }

  componentDidMount () {
    this.getDomains();
  }

  setCurrent (domain) {
    this.setState({ current: {
      domain: '',
      start: '',
      end: '',
      status: '',
      definitions: []
    } });

		if (!domain) {
      return false;
    }

    const newCurrent = this.state.current;
    const domainParts = domain.split('.');
    newCurrent.domain = domain;
    newCurrent.start = domainParts[0];
    newCurrent.end = domainParts[1];
    this.setState({ current: newCurrent });

    this.lookupDomain(newCurrent.domain);
    this.lookupWord(newCurrent.start + newCurrent.end);
  }

  lookupWord (word) {
    fetch(`http://localhost:3000/dictionary?word=${word}`)
      .then(response => response.json())
      .then(definitions => {
        if (definitions.length <= 0 || definitions.error_message || !definitions[0].description) {
          return false;
        }

        const newCurrent = this.state.current;
        newCurrent.definitions = definitions;
        this.setState({ current: newCurrent });
      });
  }

  getDomains () {
    fetch('http://localhost:3000/domains')
      .then(response => response.json())
      .then(domains => {
        this.setState({ domains });

        this.filterDomains();
      });
  }

  lookupDomain (domain) {
    fetch(`http://localhost:3000/domainr?domain=${domain}`)
      .then(response => response.json())
      .then(response => {
        if (!response) {
          return false;
        }

        const summary = response.summary;

        const statuses = {
          'unregistrable': 'unavailable',
          'dpml': 'unavailable',
          'transferable': 'available',
          'inactive': 'available',
          'active': 'taken',
          'undelegated': 'maybe',
          'pending': 'maybe'
        };

        const status = statuses[summary] || 'unknown';

        const newCurrent = this.state.current;
        newCurrent.status = status;
        if (response.info) {
          newCurrent.info = response.info;
        }
        this.setState({ current: newCurrent });
      });
  }

  handleSearch (e) {
    e.preventDefault();

    const search = e.target.value;
    this.setState({ search });

    this.filterDomains();
  }

  filterDomains () {
    const { domains, search } = this.state;
    let filteredDomains = domains;

    // if theres a search term
    if (search.trim().length > 0) {
      if (search.includes('.')) {
        filteredDomains = filteredDomains.filter(domain => domain.includes(search.trim()));
      } else {
        filteredDomains = filteredDomains.filter(domain => domain.replace('.', '').includes(search.trim()));
      }
    }

    this.setState({ filteredDomains });
  }

  render () {
    const { filteredDomains, current, search } = this.state;

    return (
      <div class="sans-serif">
				<div class="fl w-50 pa2 pa3-ns">
					<div class="pa2" style={{ height: '15vh' }}>
						<div class="cf">
							<label for="search" class="f4 fl b">Search</label>
							<small id="domains-amount" class="f4 fr black-60 i">
								{filteredDomains.length} domains found
						</small>
						</div>
						<input class="input-reset ba b--black-20 pa3 f3 db w-100 mv2" id="search" onInput={this.handleSearch} value={search} aria-describedby="domains-amount" />

					</div>
					<DomainList
						domains={filteredDomains}
						current={current}
						setCurrent={this.setCurrent}
							/>
				</div>
				<div class="fl w-50 pa2 pa3-ns">
	        <Header
	          current={current}
	          setCurrent={this.setCurrent}
	          />
				</div>
      </div>
    );
  }
}
